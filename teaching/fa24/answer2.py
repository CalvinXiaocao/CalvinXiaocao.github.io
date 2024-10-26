number_list = list(range(1, int(input()) + 1))
result_list = []

for number in number_list:
    if number % 7 and "7" not in str(number):
        result_list.append(number)

result = 0      # never use sum as a function
for num in result_list:
    result += num ** 2
print(result)   # right.
