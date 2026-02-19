nyquist (the nyquist sampling theorem / nyquist rate) is the rule that tells you how fast you must sample a signal to capture it without it "turning into a different frequency."

if your highest frequency in the signal is f_max, then you need a sampling rate f_s such that:

f_s > 2\*f_max

that 2\*f_max is the nyquist rate.

the computer never truly draws a continuous signal. it draws discrete samples.