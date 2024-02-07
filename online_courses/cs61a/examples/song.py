from wave import open
from struct import Struct
from math import floor

frame_rate = 11025


def encode(x):
    i = int(16284 * x)
    return Struct('h').pack(i)


def play(sampler, name="song.wav", seconds=2):
    out = open(name, 'wb')
    out.setnchannels(1)
    out.setsampwidth(2)
    out.setframerate(frame_rate)
    t = 0
    while t < seconds * frame_rate:
        sample = sampler(t)
        out.writeframes(encode(sample))
        t += 1
    out.close()


def tri(frequency, amplitude=0.3):
    """ A continuous triangle wave."""
    period = frame_rate // frequency

    def sampler(t):
        saw_wave = t / period - floor(t / period + 0.5)
        tri_wave = 2 * abs(2 * saw_wave) - 1
        return amplitude * tri_wave

    return sampler


c_freq = 261.63
e_freq = 329.63
g_freq = 392.00


def both(f, g, h=lambda t: 0, i=lambda t: 0):
    return lambda t: f(t) + g(t) + h(t) + i(t)


play(both(tri(c_freq), tri(g_freq), tri(c_freq * 2)))


def note(f, start, end, fade=0.01):
    def sampler(t):
        seconds = t / frame_rate
        if seconds > end or seconds < start:
            return 0
        elif seconds < start + fade:
            return (seconds - start) / fade * f(t)
        elif seconds > end - fade:
            return (end - seconds) / fade * f(t)
        return f(t)

    return sampler


c, e, g, high_c = tri(c_freq), tri(e_freq), tri(g_freq), tri(c_freq * 2)
play(both(note(c, 0, 0.5), note(e, 0.5, 1), note(g, 1, 1.5), note(high_c, 1.5, 2)))
