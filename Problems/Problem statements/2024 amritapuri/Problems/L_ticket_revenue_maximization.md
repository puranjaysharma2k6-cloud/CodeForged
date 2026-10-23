# L. Ticket Revenue Maximization

**Time limit:** 4 seconds  
**Memory limit:** 1.5 GB

There is going to be a tournament with 128 teams numbered **1, 2, ..., 128**. For each `i < j`, the team **j** is stronger than the team **i**, and in a match between them, the team **j** always wins. For each **i**, the team **i** has **P<sub>i</sub>** supporters. No two teams have any common supporters.

There will be 7 rounds in the tournament. In each round, the teams will be divided into pairs, such that each team belongs to **exactly one** pair. Each pair will play a match, with the loser being eliminated and the winner proceeding to the next round (if any). Formally,

- In the first round, the 128 teams will be paired into 64 matches. Hence, 64 teams will be eliminated, and the rest will move to the next round.
- In the second round, the 64 winning teams from the first round will be paired into 32 matches.
- In the third round, the 32 winning teams from the second round will be paired into 16 matches.
- and so on, until the final (seventh) round, where the two remaining teams will play a match.

Naturally, the later rounds are more valuable. Hence, the ticket of the **r<sup>th</sup>** round costs **r**. A match between teams **i** and **j** in the **r<sup>th</sup>** round will therefore create a revenue of **r · (P<sub>i</sub> + P<sub>j</sub>)**, as each supporter of any of the two teams will buy the tickets for the match, each costing **r**.

You are in-charge of the pairings in all the rounds, and your objective is to select the pairings in such a way that the total revenue generated through the tournament is maximized. Find this maximum revenue.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case contains a single line of input which has 128 integers - **P<sub>1</sub>, P<sub>2</sub>, ..., P<sub>128</sub>**.

## Output

For each test case, output on a new line the maximum possible revenue.

## Constraints

- `1 ≤ T ≤ 5`
- `1 ≤ P_i ≤ 10^9`

## Example

**Input**

```
2
1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
128 127 126 125 124 123 122 121 120 119 118 117 116 115 114 113 112 111 110 109 108 107 106 105 104 103 102 101 100 99 98 97 96 95 94 93 92 91 90 89 88 87 86 85 84 83 82 81 80 79 78 77 76 75 74 73 72 71 70 69 68 67 66 65 64 63 62 61 60 59 58 57 56 55 54 53 52 51 50 49 48 47 46 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30 29 28 27 26 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
```

**Output**

```
494
30318
```

## Note

All 128 numbers of each test case are on a single line in the actual tests (the original statement wraps them to fit the page).

**Test Case 1:** All matches have revenue of `r · 2` where **r** is the round number, since all `P_i = 1`.

- Round 1: 64 matches, revenue `64 · 2 = 128`
- Round 2: 32 matches, revenue `32 · 4 = 128`
- Round 3: 16 matches, revenue `16 · 6 = 96`
- Round 4: 8 matches, revenue `8 · 8 = 64`
- Round 5: 4 matches, revenue `4 · 10 = 40`
- Round 6: 2 matches, revenue `2 · 12 = 24`
- Round 7: 1 match, revenue `1 · 14 = 14`

The total revenue is `128 + 128 + 96 + 64 + 40 + 24 + 14 = 494`.
