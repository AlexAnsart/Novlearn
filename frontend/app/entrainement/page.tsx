"use client";

import { ExercisePage } from "../components/ExercisePage";
import { Layout } from "../components/Layout";
import { TrainingPage } from "../components/TrainingPage";

export default function TrainingPageRoute() {
  return (
    <Layout>
      <ExercisePage exerciseId="exemple-analyse" />
    </Layout>
  );
}
