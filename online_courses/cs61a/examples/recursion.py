

def fact(n):
    """
    >>> fact(0)
    1
    >>> fact(1)
    1
    >>> fact(3)
    6
    """
    if n == 0:
        return 1
    else:
        return fact(n - 1) * n




