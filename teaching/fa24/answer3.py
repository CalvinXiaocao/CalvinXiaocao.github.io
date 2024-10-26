N, M = tuple(map(int, input().split()))
questions, answers = [], []
for _ in range(N):
    questions.append(input())
for _ in range(N):
    answers.append(input())

for i in range(N):
    for j in range(M):
        student_answer = input()
        print(f"{questions[i]}\t{student_answer}\t{answers[i]}")
