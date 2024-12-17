-- CreateTable
CREATE TABLE "trainings" (
    "id" TEXT NOT NULL,
    "training_name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "batch_size" TEXT NOT NULL,
    "specific_layers_trained" TEXT NOT NULL,
    "lora_rank" TEXT NOT NULL,
    "trigger_word" TEXT NOT NULL,
    "caption_dropout_rate" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "learning_rate" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);
