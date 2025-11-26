# PERT Chart Generator

A Python tool to generate PERT (Program Evaluation and Review Technique) charts from CSV data, calculate critical paths, and visualize project dependencies.

## Features

- **CSV Import**: Load project tasks, durations, and dependencies from CSV
- **PERT Analysis**: Calculate earliest/latest start/finish times, slack, and critical path
- **Dual Visualization**: Generate both PERT network diagrams and Gantt charts
- **Validation**: Detect circular dependencies and missing task references
- **Critical Path Analysis**: Identify tasks that determine project duration
- **Slack Visualization**: Show available slack time in Gantt charts

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python generate_pert.py
```

The script will:
1. Load tasks from `pert.csv`
2. Build the dependency graph
3. Calculate PERT metrics
4. Display a summary table
5. Generate `pert_chart.png` (network diagram)
6. Generate `gantt_chart.png` (timeline visualization)

## CSV Format

The CSV file should have the following structure:

```csv
Task,Duration,Dependencies
Task1,1.0,
Task2,2.0,Task1
Task3,1.5,Task1 Task2
```

- **Task**: Unique task identifier/name
- **Duration**: Task duration (numeric value)
- **Dependencies**: Space-separated list of task names that must complete before this task starts

## Output

### Console Output
- Project duration
- Critical path tasks
- Detailed table with ES, EF, LS, LF, and Slack for each task

### Visualizations

#### PERT Chart (`pert_chart.png`)
Network diagram showing:
- All tasks as nodes
- Dependencies as directed edges
- Critical path highlighted in red
- Non-critical tasks in blue

#### Gantt Chart (`gantt_chart.png`)
Timeline visualization showing:
- Tasks sorted by earliest start time
- Horizontal bars representing task duration
- Critical tasks in red, non-critical in blue
- Slack time displayed as gray bars (when available)
- Dependency arrows between tasks
- Grid lines for easy time reference

## Example Output

```
Total Project Duration: 12.50 time units
Critical Path Length: 17 tasks
```

## Project Structure

```
PERT_NovLearn/
├── generate_pert.py      # Main PERT generator script
├── pert.csv              # Input CSV file with tasks
├── requirements.txt      # Python dependencies
├── pert_chart.png        # PERT network diagram
├── gantt_chart.png       # Gantt chart visualization
└── README.md            # This file
```

## Technical Details

- Uses **NetworkX** for graph operations and topological sorting
- Uses **Matplotlib** for visualization
- Implements forward pass (earliest times) and backward pass (latest times)
- Calculates slack as: `Slack = Latest Start - Earliest Start`
- Critical path: tasks with zero slack

## Error Handling

The script validates:
- Missing dependencies (warns if referenced task doesn't exist)
- Circular dependencies (raises error if cycles detected)
- Invalid durations (handles non-numeric values)

## License

This project follows industry standards for data science and project management tools.

