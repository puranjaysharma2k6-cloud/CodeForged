-- CreateTable
CREATE TABLE "ProblemTag" (
    "problemId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("problemId","tag")
);

-- CreateTable
CREATE TABLE "UserTopicStats" (
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTopicStats_pkey" PRIMARY KEY ("userId","tag")
);

-- CreateTable
CREATE TABLE "UserTopicAnalysisCache" (
    "userId" TEXT NOT NULL,
    "targetTag" TEXT NOT NULL,
    "verdictAnalysis" TEXT NOT NULL,
    "whatWentWrong" TEXT NOT NULL,
    "betterApproach" TEXT NOT NULL,
    "recommendedDataStructure" TEXT NOT NULL,
    "statsHash" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTopicAnalysisCache_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "ProblemTag_problemId_idx" ON "ProblemTag"("problemId");

-- CreateIndex
CREATE INDEX "UserTopicStats_userId_idx" ON "UserTopicStats"("userId");

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
