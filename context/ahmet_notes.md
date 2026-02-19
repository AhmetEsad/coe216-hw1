# task 1

## requirements
- pdf report
	- cover: group members
	- method: explain the sampling frequency
	- graphs: screenshots of the 3 graphs obtained
	- github link: should include a link to the github repository
	- references: list of tools/resources used while completing this assignment
	- division of labor: "the contributions each team member makes while completing this assignment (coding, report writing, mathematical calculations, etc.)"

- (public?) github repository
	- should include all the code

## variables
- f0 = sum([int(str(n)[-2:]) for n in group_members]) = 128 Hz
- f1 = f0 = 128 Hz
- f2 = f0 / 2 = 64 Hz
- f3 = 10 * f0 = 1280 Hz

## technical regulations
- visualization: f1, f2 and f3 should be displayed in three separate subplots, stacked on top of each other + "the signal obtained by sum of three signals should be shown in a separate graph"
	- https://auditoryneuroscience.com/mov
- time window: each graph should display at least 3 full periods of its signal
- sampling: apply the nyquist sampling theorem (2\*f_max Hz)

# task 2

"DTMF is a system where each key on a telephone keypad represents the sum of two different sinusoidal signals, one from a "low" and the other from a "high" frequency group ( x(t) = sin(2pi f_low t) + sin(2pi f_high t) ). Your reports are expected to include the standard DTMF frequency table (row and column frequencies)."

## requirements
- pdf report
	- cover: group members
	- mathematical method: DTMF frequency table and rationale for choosing the sampling frequency used.
	- screenshots: a graph of the developed interface and a sample signal generated when a key is pressed.
	- github link: should include a link to the github repository
	- references: list of tools/resources used while completing this assignment
	- division of labor: "the contributions each team member makes while completing this assignment (coding, report writing, mathematical calculations, etc.)"

- (public?) github repository
	- should include all the code

## variables
LOWS = [697, 770, 852, 941]
HIGHS = [1209, 1336, 1477, 1633]