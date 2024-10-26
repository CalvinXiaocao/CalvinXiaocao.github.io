input_string = input().split()
a, b, c, d = tuple(map(int, input_string))

result_hour, result_minute = 0, 0
# if start time equals finish time
if a == c and b == d:
    result_hour = 24
else:
    result_minute = d - b
    if result_minute < 0:
        result_minute += 60
        result_hour -= 1
    result_hour += c - a
    if result_hour < 0:
        result_hour += 24

print(f"GAME TIME {result_hour} HOUR(S) {result_minute} MINUTE(S)")
