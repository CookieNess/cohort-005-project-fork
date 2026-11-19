import { useState, useEffect } from "react";
import { Link, useFetcher } from "react-router";
import { toast } from "sonner";
import type { Route } from "../../routes/+types/courses.$slug.lessons.$lessonId";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { isRouteErrorResponse } from "react-router";

export function QuizSection({
  quiz,
  bestAttempt,
  quizResult,
  quizFetcher,
  isSubmitting,
}: {
  quiz: {
    id: number;
    title: string;
    passingScore: number;
    questions: Array<{
      id: number;
      questionText: string;
      questionType: string;
      position: number;
      options: Array<{ id: number; optionText: string }>;
    }>;
  };
  bestAttempt: { score: number; passed: boolean } | null;
  quizResult: {
    attemptId: number;
    score: number;
    passed: boolean;
    grade: string;
    totalCorrect: number;
    totalQuestions: number;
    questionResults: Array<{
      questionId: number;
      correct: boolean;
      selectedOptionId: number | null;
      correctOptionId: number | null;
    }>;
  } | null;
  quizFetcher: ReturnType<typeof useFetcher>;
  isSubmitting: boolean;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showQuiz, setShowQuiz] = useState(!bestAttempt?.passed);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    if (quizResult && !retaking) {
      if (quizResult.passed) {
        toast.success(
          `Quiz passed! Score: ${Math.round(quizResult.score * 100)}%`
        );
      } else {
        toast.error(
          `Quiz not passed. Score: ${Math.round(quizResult.score * 100)}%`
        );
      }
    }
  }, [quizResult, retaking]);

  const allAnswered = quiz.questions.every(
    (q) => selectedAnswers[q.id] !== undefined
  );
  const showResult = quizResult && !retaking;

  if (showResult) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
          </div>

          {/* Results summary */}
          <div
            className={`mb-6 rounded-lg p-4 ${quizResult.passed ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}
          >
            <div className="flex items-center gap-3">
              {quizResult.passed ? (
                <Trophy className="size-8 text-green-600" />
              ) : (
                <XCircle className="size-8 text-red-600" />
              )}
              <div>
                <p
                  className={`text-lg font-semibold ${quizResult.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                >
                  {quizResult.passed ? "You passed!" : "Not quite — try again!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score: {quizResult.totalCorrect}/{quizResult.totalQuestions} (
                  {Math.round(quizResult.score * 100)}%) — Grade:{" "}
                  {quizResult.grade}
                </p>
              </div>
            </div>
          </div>

          {/* Per-question results */}
          <div className="space-y-4">
            {quiz.questions.map((question, qIndex) => {
              const result = quizResult.questionResults.find(
                (r) => r.questionId === question.id
              );
              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start gap-2">
                    {result?.correct ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                    )}
                    <p className="font-medium">
                      {qIndex + 1}. {question.questionText}
                    </p>
                  </div>
                  <div className="ml-7 space-y-1">
                    {question.options.map((option) => {
                      const isSelected = result?.selectedOptionId === option.id;
                      const isCorrect = result?.correctOptionId === option.id;
                      let className = "text-sm";
                      if (isCorrect)
                        className +=
                          " font-medium text-green-700 dark:text-green-400";
                      else if (isSelected && !result?.correct)
                        className +=
                          " text-red-600 dark:text-red-400 line-through";
                      return (
                        <p key={option.id} className={className}>
                          {isCorrect ? "✓ " : isSelected ? "✗ " : "  "}
                          {option.optionText}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Retake button */}
          {!quizResult.passed && (
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAnswers({});
                  setRetaking(true);
                }}
              >
                <RotateCcw className="mr-2 size-4" />
                Retake Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!showQuiz && bestAttempt?.passed) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-green-600" />
              <span className="font-medium">{quiz.title}</span>
              <span className="text-sm text-muted-foreground">
                — Best score: {Math.round(bestAttempt.score * 100)}%
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuiz(true)}
            >
              <RotateCcw className="mr-2 size-4" />
              Retake
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">{quiz.title}</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Answer all questions and submit. Passing score:{" "}
          {Math.round(quiz.passingScore * 100)}%.
        </p>

        <quizFetcher.Form method="post" onSubmit={() => setRetaking(false)}>
          <input type="hidden" name="intent" value="submit-quiz" />
          <input type="hidden" name="quizId" value={quiz.id} />

          <div className="space-y-6">
            {quiz.questions.map((question, qIndex) => (
              <div key={question.id} className="rounded-lg border p-4">
                <p className="mb-3 font-medium">
                  {qIndex + 1}. {question.questionText}
                </p>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={selectedAnswers[question.id] === option.id}
                        onChange={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [question.id]: option.id,
                          }))
                        }
                        className="size-4 accent-primary"
                      />
                      <span className="text-sm">{option.optionText}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={!allAnswered || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
            {!allAnswered && (
              <p className="mt-2 text-sm text-muted-foreground">
                Please answer all questions before submitting.
              </p>
            )}
          </div>
        </quizFetcher.Form>
      </CardContent>
    </Card>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let message = "An unexpected error occurred while loading this lesson.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Lesson not found";
      message =
        "The lesson you're looking for doesn't exist or may have been removed.";
    } else if (error.status === 401) {
      title = "Sign in required";
      message =
        typeof error.data === "string"
          ? error.data
          : "Please select a user from the DevUI panel.";
    } else {
      title = `Error ${error.status}`;
      message = typeof error.data === "string" ? error.data : error.statusText;
    }
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        <p className="mb-6 text-muted-foreground">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/courses">
            <Button variant="outline">Browse Courses</Button>
          </Link>
          <Link to="/dashboard">
            <Button>My Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
