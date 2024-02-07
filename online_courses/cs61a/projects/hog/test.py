from hog import is_always_roll


def s(x, y):
    if x == 60 and y == 0:
        return 0
    else:
        return 1


m = is_always_roll(s)
print(m)
