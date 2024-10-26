def score(id, point):
    if id[0:2] == "23":
        return point + 15
    elif id[0:2] == "22":
        return point + 25
    elif id[0:2] == "21":
        return point + 50
    else:
        return point + 75

friend_id = input()
friend_score = 0
score_list = []
while True:
    input_str = input()
    if input_str == "end":
        break
    input_list = input_str.split(",")
    id, point = input_list[0], int(input_list[1])
    current_score = score(id, point)
    # if haven't learn function yet, just delete line 20 and insert line 2-9 here.
    # replace all the "return"s with "current_score = "
    if id == friend_id:
        friend_score = current_score
    score_list.append(current_score)

result = 0
for i in range(len(score_list)):
    if score_list[i] > friend_score:
        result += 1
print(result)
