from wave import open
from struct import Struct
from math import floor

frame_rate = 11025

print("Merry Christmas!")


def encode(x):
    i = int(16284 * x)
    return Struct('h').pack(i)


def play(sampler, seconds=2, name="christmas.wav"):
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
d_freq = 293.66
f_freq = 349.23
a_freq = 440.00
b_freq = 493.88


def both(f, g, h=lambda t: 0, i=lambda t: 0):
    return lambda t: f(t) + g(t) + h(t) + i(t)


def note(f, start, end, fade=0.002):
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

d, f = tri(d_freq), tri(f_freq)

play(both(both(note(e,0,0.2),note(e,0.25,0.45),note(e,0.5,0.9)),
          both(note(e,1,1.2),note(e,1.25,1.45),note(e,1.5,1.9)),
          both(note(e,2,2.2),note(g,2.25,2.45),note(c,2.5,2.8),note(d,2.85,2.95)),
          note(e,3.0,3.7)),4)



