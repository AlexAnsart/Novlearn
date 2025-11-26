"""
PERT Chart Generator
Generates a PERT (Program Evaluation and Review Technique) chart from CSV data.
Calculates critical path, earliest/latest start/finish times, and slack.
"""

import csv
import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from typing import Dict, List, Tuple, Optional
from collections import defaultdict


class PERTChartGenerator:
    """Generates and visualizes PERT charts from CSV data."""
    
    def __init__(self, csv_file: str):
        """Initialize with CSV file path."""
        self.csv_file = csv_file
        self.tasks: Dict[str, float] = {}  # task_name -> duration
        self.dependencies: Dict[str, List[str]] = {}  # task_name -> [dependencies]
        self.graph = nx.DiGraph()
        self.earliest_start: Dict[str, float] = {}
        self.earliest_finish: Dict[str, float] = {}
        self.latest_start: Dict[str, float] = {}
        self.latest_finish: Dict[str, float] = {}
        self.slack: Dict[str, float] = {}
        self.critical_path: List[str] = []
        
    def load_csv(self) -> None:
        """Load tasks and dependencies from CSV file."""
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                task = row['Task'].strip()
                duration = float(row['Duration'])
                deps_str = row.get('Dependencies', '').strip()
                
                self.tasks[task] = duration
                
                # Parse dependencies (space-separated)
                if deps_str:
                    deps = [dep.strip() for dep in deps_str.split() if dep.strip()]
                    self.dependencies[task] = deps
                else:
                    self.dependencies[task] = []
        
        # Validate dependencies
        all_tasks = set(self.tasks.keys())
        missing_deps = []
        for task, deps in self.dependencies.items():
            for dep in deps:
                if dep not in all_tasks:
                    missing_deps.append((task, dep))
        
        if missing_deps:
            print("WARNING: Missing dependencies found:")
            for task, dep in missing_deps:
                print(f"  Task '{task}' references missing dependency '{dep}'")
        
    def build_graph(self) -> None:
        """Build directed graph from tasks and dependencies."""
        # Add all nodes
        for task in self.tasks:
            self.graph.add_node(task, duration=self.tasks[task])
        
        # Add edges (dependencies)
        for task, deps in self.dependencies.items():
            for dep in deps:
                if dep in self.tasks:  # Only add if dependency exists
                    self.graph.add_edge(dep, task)
        
        # Check for cycles
        if not nx.is_directed_acyclic_graph(self.graph):
            cycles = list(nx.simple_cycles(self.graph))
            print("ERROR: Circular dependencies detected!")
            for cycle in cycles:
                print(f"  Cycle: {' -> '.join(cycle)} -> {cycle[0]}")
            raise ValueError("Graph contains cycles - PERT requires a DAG")
    
    def calculate_forward_pass(self) -> None:
        """Calculate earliest start and finish times (forward pass)."""
        # Topological sort ensures we process tasks in dependency order
        topo_order = list(nx.topological_sort(self.graph))
        
        for task in topo_order:
            # Earliest start is max of all predecessor finish times
            pred_finish_times = [
                self.earliest_finish[pred] 
                for pred in self.graph.predecessors(task)
            ]
            
            if pred_finish_times:
                self.earliest_start[task] = max(pred_finish_times)
            else:
                self.earliest_start[task] = 0.0
            
            # Earliest finish = earliest start + duration
            self.earliest_finish[task] = (
                self.earliest_start[task] + self.tasks[task]
            )
    
    def calculate_backward_pass(self) -> None:
        """Calculate latest start and finish times (backward pass)."""
        # Get project completion time (max earliest finish)
        project_end = max(self.earliest_finish.values())
        
        # Process in reverse topological order
        topo_order = list(nx.topological_sort(self.graph))
        reverse_order = list(reversed(topo_order))
        
        for task in reverse_order:
            # Latest finish is min of all successor start times
            succ_start_times = [
                self.latest_start[succ]
                for succ in self.graph.successors(task)
            ]
            
            if succ_start_times:
                self.latest_finish[task] = min(succ_start_times)
            else:
                # End node - latest finish = project end
                self.latest_finish[task] = project_end
            
            # Latest start = latest finish - duration
            self.latest_start[task] = (
                self.latest_finish[task] - self.tasks[task]
            )
    
    def calculate_slack(self) -> None:
        """Calculate slack (float) for each task."""
        for task in self.tasks:
            self.slack[task] = (
                self.latest_start[task] - self.earliest_start[task]
            )
    
    def find_critical_path(self) -> None:
        """Identify critical path (tasks with zero slack)."""
        self.critical_path = [
            task for task in self.tasks 
            if abs(self.slack[task]) < 1e-6  # Account for floating point errors
        ]
    
    def calculate_pert(self) -> None:
        """Calculate all PERT metrics."""
        self.calculate_forward_pass()
        self.calculate_backward_pass()
        self.calculate_slack()
        self.find_critical_path()
    
    def print_summary(self) -> None:
        """Print PERT analysis summary."""
        project_duration = max(self.earliest_finish.values())
        
        print("\n" + "="*80)
        print("PERT ANALYSIS SUMMARY")
        print("="*80)
        print(f"\nTotal Project Duration: {project_duration:.2f} time units")
        print(f"\nCritical Path Length: {len(self.critical_path)} tasks")
        print(f"\nCritical Path Tasks:")
        for task in self.critical_path:
            print(f"  - {task} (Duration: {self.tasks[task]:.2f})")
        
        print(f"\n{'Task':<35} {'ES':<8} {'EF':<8} {'LS':<8} {'LF':<8} {'Slack':<8} {'Critical':<10}")
        print("-"*100)
        for task in sorted(self.tasks.keys()):
            is_critical = "Yes" if task in self.critical_path else "No"
            print(f"{task:<35} {self.earliest_start[task]:<8.2f} "
                  f"{self.earliest_finish[task]:<8.2f} {self.latest_start[task]:<8.2f} "
                  f"{self.latest_finish[task]:<8.2f} {self.slack[task]:<8.2f} {is_critical:<10}")
        print("="*80 + "\n")
    
    def visualize(self, output_file: str = "pert_chart.png", 
                  figsize: Tuple[int, int] = (20, 14)) -> None:
        """Visualize PERT chart using NetworkX and Matplotlib."""
        # Use hierarchical layout for better readability
        try:
            pos = nx.nx_agraph.graphviz_layout(self.graph, prog='dot')
        except:
            # Fallback to spring layout if graphviz not available
            pos = nx.spring_layout(self.graph, k=2, iterations=50)
        
        fig, ax = plt.subplots(figsize=figsize)
        
        # Separate critical and non-critical nodes
        critical_nodes = set(self.critical_path)
        non_critical_nodes = set(self.tasks.keys()) - critical_nodes
        
        # Draw edges
        critical_edges = [
            (u, v) for u, v in self.graph.edges() 
            if u in critical_nodes and v in critical_nodes
        ]
        non_critical_edges = [
            (u, v) for u, v in self.graph.edges() 
            if (u, v) not in critical_edges
        ]
        
        # Draw non-critical edges first (gray)
        nx.draw_networkx_edges(
            self.graph, pos, 
            edgelist=non_critical_edges,
            edge_color='lightgray',
            width=1.5,
            alpha=0.6,
            arrows=True,
            arrowsize=20,
            arrowstyle='->',
            ax=ax
        )
        
        # Draw critical edges (red, thicker)
        nx.draw_networkx_edges(
            self.graph, pos,
            edgelist=critical_edges,
            edge_color='red',
            width=3,
            alpha=0.8,
            arrows=True,
            arrowsize=25,
            arrowstyle='->',
            ax=ax
        )
        
        # Draw non-critical nodes
        nx.draw_networkx_nodes(
            self.graph, pos,
            nodelist=list(non_critical_nodes),
            node_color='lightblue',
            node_size=2000,
            alpha=0.8,
            ax=ax
        )
        
        # Draw critical nodes
        nx.draw_networkx_nodes(
            self.graph, pos,
            nodelist=list(critical_nodes),
            node_color='red',
            node_size=2500,
            alpha=0.9,
            ax=ax
        )
        
        # Create labels with task name and duration
        labels = {
            task: f"{task}\n({self.tasks[task]:.1f})" 
            for task in self.tasks
        }
        
        nx.draw_networkx_labels(
            self.graph, pos, labels,
            font_size=7,
            font_weight='bold',
            ax=ax
        )
        
        # Add legend
        critical_patch = mpatches.Patch(color='red', label='Critical Path')
        non_critical_patch = mpatches.Patch(color='lightblue', label='Non-Critical Tasks')
        ax.legend(handles=[critical_patch, non_critical_patch], loc='upper left')
        
        ax.set_title(
            f"PERT Chart - Project Duration: {max(self.earliest_finish.values()):.2f} time units",
            fontsize=16,
            fontweight='bold',
            pad=20
        )
        ax.axis('off')
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"PERT chart saved to: {output_file}")
        plt.close()
    
    def visualize_gantt(self, output_file: str = "gantt_chart.png",
                       figsize: Tuple[int, int] = (16, 12),
                       show_slack: bool = True) -> None:
        """Generate Gantt chart visualization."""
        # Sort tasks by earliest start time for better visualization
        sorted_tasks = sorted(
            self.tasks.keys(),
            key=lambda t: (self.earliest_start[t], t)
        )
        
        # Create figure
        fig, ax = plt.subplots(figsize=figsize)
        
        # Calculate project duration
        project_end = max(self.earliest_finish.values())
        
        # Prepare data for Gantt bars
        critical_tasks = set(self.critical_path)
        y_positions = range(len(sorted_tasks))
        
        # Draw bars for each task
        for idx, task in enumerate(sorted_tasks):
            es = self.earliest_start[task]
            ef = self.earliest_finish[task]
            ls = self.latest_start[task]
            lf = self.latest_finish[task]
            duration = self.tasks[task]
            slack = self.slack[task]
            
            # Determine color based on critical path
            if task in critical_tasks:
                color = '#d32f2f'  # Red for critical
                alpha = 0.9
            else:
                color = '#1976d2'  # Blue for non-critical
                alpha = 0.7
            
            # Draw main bar (earliest schedule)
            ax.barh(
                idx, duration,
                left=es,
                color=color,
                alpha=alpha,
                height=0.6,
                edgecolor='black',
                linewidth=1.2,
                label='Critical' if task in critical_tasks and idx == 0 else ''
            )
            
            # Draw slack bar (if enabled and slack > 0)
            if show_slack and slack > 0.01:  # Only show if significant slack
                slack_duration = lf - ef
                if slack_duration > 0.01:
                    ax.barh(
                        idx, slack_duration,
                        left=ef,
                        color='lightgray',
                        alpha=0.4,
                        height=0.6,
                        edgecolor='gray',
                        linewidth=0.8,
                        linestyle='--'
                    )
        
        # Draw dependency arrows (from dependencies to tasks)
        arrow_props = dict(
            arrowstyle='->',
            lw=1.5,
            alpha=0.5,
            color='gray',
            connectionstyle='arc3,rad=0.1'
        )
        
        for task in sorted_tasks:
            task_idx = sorted_tasks.index(task)
            task_es = self.earliest_start[task]
            task_y = task_idx
            
            # Draw arrows from dependencies to this task
            for dep in self.dependencies.get(task, []):
                if dep in sorted_tasks:
                    dep_idx = sorted_tasks.index(dep)
                    dep_ef = self.earliest_finish[dep]
                    dep_y = dep_idx
                    
                    # Only draw if visually meaningful (not too close)
                    if abs(dep_y - task_y) > 0.5:
                        ax.annotate(
                            '', xy=(task_es, task_y),
                            xytext=(dep_ef, dep_y),
                            arrowprops=arrow_props
                        )
        
        # Customize axes
        ax.set_yticks(y_positions)
        ax.set_yticklabels(sorted_tasks, fontsize=8)
        ax.set_xlabel('Time (units)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Tasks', fontsize=12, fontweight='bold')
        ax.set_title(
            f'Gantt Chart - Project Duration: {project_end:.2f} time units',
            fontsize=14,
            fontweight='bold',
            pad=20
        )
        
        # Set x-axis limits
        ax.set_xlim(-0.5, project_end + 0.5)
        
        # Add grid
        ax.grid(True, axis='x', alpha=0.3, linestyle='--')
        ax.set_axisbelow(True)
        
        # Add legend
        critical_patch = mpatches.Patch(color='#d32f2f', alpha=0.9, label='Critical Tasks')
        non_critical_patch = mpatches.Patch(color='#1976d2', alpha=0.7, label='Non-Critical Tasks')
        if show_slack:
            slack_patch = mpatches.Patch(color='lightgray', alpha=0.4, label='Slack Time', linestyle='--')
            ax.legend(handles=[critical_patch, non_critical_patch, slack_patch], 
                     loc='upper right', fontsize=10)
        else:
            ax.legend(handles=[critical_patch, non_critical_patch], 
                     loc='upper right', fontsize=10)
        
        # Invert y-axis to show tasks from top to bottom
        ax.invert_yaxis()
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"Gantt chart saved to: {output_file}")
        plt.close()


def main():
    """Main function to generate PERT chart."""
    csv_file = "pert.csv"
    
    print("Loading PERT data from CSV...")
    generator = PERTChartGenerator(csv_file)
    
    try:
        generator.load_csv()
        print(f"Loaded {len(generator.tasks)} tasks")
        
        print("Building dependency graph...")
        generator.build_graph()
        print(f"Graph has {generator.graph.number_of_nodes()} nodes and "
              f"{generator.graph.number_of_edges()} edges")
        
        print("Calculating PERT metrics...")
        generator.calculate_pert()
        
        generator.print_summary()
        
        print("Generating visualizations...")
        generator.visualize("pert_chart.png")
        generator.visualize_gantt("gantt_chart.png")
        
        print("\nPERT analysis complete!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

