friend_id = input()
friend_score = 0
score_list = []
while True:
    input_str = input()
    if input_str == "end":
        break
    input_list = input_str.split(",")
    id, point = input_list[0], int(input_list[1])
    
    if id[0:2] == "23":
        current_score = point + 15
    elif id[0:2] == "22":
        current_score = point + 25
    elif id[0:2] == "21":
        current_score = point + 50
    else:
        current_score = point + 75


    if id == friend_id:
        friend_score = current_score
    score_list.append(current_score)

result = 0
for i in range(len(score_list)):
    if score_list[i] > friend_score:
        result += 1
print(result)
