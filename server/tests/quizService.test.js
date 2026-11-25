jest.mock("../src/models/Instructor", () => ({ findOne: jest.fn() }));
jest.mock("../src/models/QuizAttempt", () => ({ create: jest.fn(), find: jest.fn() }));
jest.mock("../src/models/Quiz", () => {
  function MockQuiz(data) {
    Object.assign(this, data);
  }
  MockQuiz.prototype.save = jest.fn();
  MockQuiz.find = jest.fn();
  MockQuiz.findOne = jest.fn();
  MockQuiz.findById = jest.fn();
  return MockQuiz;
});

const Instructor = require("../src/models/Instructor");
const Quiz = require("../src/models/Quiz");
const QuizAttempt = require("../src/models/QuizAttempt");
const quizService = require("../src/services/quizService");

// A chainable stand-in for a Mongoose query.
function fakeQuery(result) {
  const q = {
    populate() { return q; },
    find() { return q; },
    sort() { return q; },
    select() { return q; },
    skip() { return q; },
    limit() { return q; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return q;
}

const sampleQuiz = {
  _id: "quiz-1",
  title: "JavaScript Basics",
  published: true,
  instructor: "instructor-1",
  questions: [
    { text: "2+2?", options: ["3", "4"], correctIndex: 1 },
    { text: "JS is...", options: ["compiled", "interpreted"], correctIndex: 1 },
  ],
};

afterEach(() => jest.clearAllMocks());

describe("listQuizzes", () => {
  test("only queries published quizzes and strips correct answers", async () => {
    Quiz.find.mockReturnValue(fakeQuery([sampleQuiz]));

    const result = await quizService.listQuizzes({});

    expect(Quiz.find).toHaveBeenCalledWith({ published: true });
    expect(result.count).toBe(1);
    expect(result.quizzes[0].questions[0]).toEqual({ text: "2+2?", options: ["3", "4"] });
    expect(result.quizzes[0].questions[0].correctIndex).toBeUndefined();
  });
});

describe("getQuizBySlug", () => {
  test("returns the quiz without correct answers", async () => {
    Quiz.findOne.mockReturnValue(fakeQuery(sampleQuiz));

    const result = await quizService.getQuizBySlug("javascript-basics-abc123");

    expect(Quiz.findOne).toHaveBeenCalledWith({ slug: "javascript-basics-abc123", published: true });
    expect(result.questions.every((q) => q.correctIndex === undefined)).toBe(true);
  });

  test("throws a 404 when the slug is missing or unpublished", async () => {
    Quiz.findOne.mockReturnValue(fakeQuery(null));

    await expect(quizService.getQuizBySlug("nope")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("createQuiz", () => {
  test("rejects users without an instructor profile", async () => {
    Instructor.findOne.mockResolvedValue(null);

    await expect(quizService.createQuiz("user-1", { title: "X" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test("links the new quiz to the instructor profile", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Quiz.prototype.save.mockResolvedValue(undefined);

    const result = await quizService.createQuiz("user-1", {
      title: "JS Basics",
      questions: sampleQuiz.questions,
    });

    expect(result.instructor).toBe("instructor-1");
    expect(Quiz.prototype.save).toHaveBeenCalled();
  });
});

describe("updateQuiz", () => {
  test("updates editable fields for the owner", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    const quiz = { instructor: "instructor-1", title: "Old", save: jest.fn() };
    Quiz.findById.mockResolvedValue(quiz);

    const result = await quizService.updateQuiz("user-1", "quiz-1", { title: "New", published: true });

    expect(result.title).toBe("New");
    expect(result.published).toBe(true);
    expect(quiz.save).toHaveBeenCalled();
  });

  test("rejects non-owners with 403", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Quiz.findById.mockResolvedValue({ instructor: "someone-else", save: jest.fn() });

    await expect(
      quizService.updateQuiz("user-1", "quiz-1", { title: "Hijack" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("throws 404 when the quiz does not exist", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Quiz.findById.mockResolvedValue(null);

    await expect(quizService.updateQuiz("user-1", "quiz-1", {})).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("deleteQuiz", () => {
  test("deletes an owned quiz", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    const quiz = { instructor: "instructor-1", deleteOne: jest.fn() };
    Quiz.findById.mockResolvedValue(quiz);

    const result = await quizService.deleteQuiz("user-1", "quiz-1");

    expect(quiz.deleteOne).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});

describe("gradeQuiz", () => {
  beforeEach(() => {
    QuizAttempt.create.mockImplementation(async (data) => ({ _id: "attempt-1", ...data }));
  });

  test("gives full marks for a perfect submission", async () => {
    Quiz.findById.mockResolvedValue(sampleQuiz);

    const result = await quizService.gradeQuiz("user-9", "quiz-1", [1, 1]);

    expect(result).toMatchObject({ attemptId: "attempt-1", total: 2, correct: 2, scorePercent: 100 });
    expect(result.perQuestion).toEqual([
      { question: 0, correct: true },
      { question: 1, correct: true },
    ]);
  });

  test("grades partial and wrong answers honestly", async () => {
    Quiz.findById.mockResolvedValue(sampleQuiz);

    const result = await quizService.gradeQuiz("user-9", "quiz-1", [0, 1]);

    expect(result).toMatchObject({ total: 2, correct: 1, scorePercent: 50 });
    expect(result.perQuestion[0].correct).toBe(false);
  });

  test("missing answers count as wrong", async () => {
    Quiz.findById.mockResolvedValue(sampleQuiz);

    const result = await quizService.gradeQuiz("user-9", "quiz-1", []);

    expect(result.correct).toBe(0);
    expect(result.perQuestion).toHaveLength(2);
  });

  test("rejects missing or unpublished quizzes with 404", async () => {
    Quiz.findById.mockResolvedValue(null);
    await expect(quizService.gradeQuiz("user-9", "quiz-1", [])).rejects.toMatchObject({ statusCode: 404 });

    Quiz.findById.mockResolvedValue({ ...sampleQuiz, published: false });
    await expect(quizService.gradeQuiz("user-9", "quiz-1", [])).rejects.toMatchObject({ statusCode: 404 });
  });

  test("a quiz with no questions scores 0 percent", async () => {
    Quiz.findById.mockResolvedValue({ ...sampleQuiz, questions: [] });

    const result = await quizService.gradeQuiz("user-9", "quiz-1", []);

    expect(result).toMatchObject({ total: 0, correct: 0, scorePercent: 0 });
  });

  test("persists the attempt with the quiz, user and score", async () => {
    Quiz.findById.mockResolvedValue(sampleQuiz);

    await quizService.gradeQuiz("user-9", "quiz-1", [1, 0]);

    expect(QuizAttempt.create).toHaveBeenCalledWith({
      quiz: "quiz-1",
      user: "user-9",
      answers: [1, 0],
      correct: 1,
      total: 2,
      scorePercent: 50,
    });
  });
});

describe("listMyAttempts", () => {
  test("only queries attempts that belong to the user", async () => {
    QuizAttempt.find.mockReturnValue(fakeQuery([{ scorePercent: 50 }]));

    const result = await quizService.listMyAttempts("user-9", {});

    expect(QuizAttempt.find).toHaveBeenCalledWith({ user: "user-9" });
    expect(result).toEqual({ count: 1, attempts: [{ scorePercent: 50 }] });
  });
});

describe("listQuizAttemptsForOwner", () => {
  test("returns attempts when the instructor owns the quiz", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Quiz.findById.mockResolvedValue({ _id: "quiz-1", instructor: "instructor-1" });
    QuizAttempt.find.mockReturnValue(fakeQuery([{ scorePercent: 100 }]));

    const result = await quizService.listQuizAttemptsForOwner("user-1", "quiz-1");

    expect(QuizAttempt.find).toHaveBeenCalledWith({ quiz: "quiz-1" });
    expect(result.count).toBe(1);
  });

  test("rejects instructors who do not own the quiz", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Quiz.findById.mockResolvedValue({ _id: "quiz-1", instructor: "someone-else" });

    await expect(
      quizService.listQuizAttemptsForOwner("user-1", "quiz-1")
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
