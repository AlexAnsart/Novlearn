import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    // Chemin vers le dossier data dans public
    const dataDirectory = path.join(process.cwd(), "public", "data");

    // Lire tous les fichiers du dossier
    const files = await fs.readdir(dataDirectory);

    // Filtrer uniquement les fichiers JSON
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    // Lire les métadonnées de chaque exercice
    const exercises = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(dataDirectory, file);
          const fileContent = await fs.readFile(filePath, "utf-8");
          const exerciseData = JSON.parse(fileContent);

          return {
            id: file.replace(".json", ""),
            name: exerciseData.title || file.replace(".json", ""),
            chapter: exerciseData.chapter,
            difficulty: exerciseData.difficulty,
            fileName: file,
          };
        } catch (error) {
          console.error(`Erreur lors de la lecture de ${file}:`, error);
          return null;
        }
      })
    );

    // Filtrer les exercices qui n'ont pas pu être chargés
    const validExercises = exercises.filter((ex) => ex !== null);

    return NextResponse.json({
      success: true,
      exercises: validExercises,
      count: validExercises.length,
    });
  } catch (error) {
    console.error("Erreur lors de la lecture des exercices:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de lire les exercices",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
