"use client";

import { ExercisePage } from "../components/ExercisePage";
import { Layout } from "../components/Layout";

export default function TrainingPageRoute() {
  return (
    <Layout isFullScreen>
      <ExercisePage exerciseId="exemple-analyse" />
    </Layout>
  );
}
