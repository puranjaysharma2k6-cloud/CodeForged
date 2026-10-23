# K. Max Mod

**Time limit:** 1.5 seconds  
**Memory limit:** 1.5 GB

You have an array **A** of **N** integers. Initially, all `A_i = 0`. You are also given a **prime** **M**.

Handle updates and queries of the following format:

1. Given **X, Y**: add `X + (i - 1) · Y` to **A<sub>i</sub>** for all `1 ≤ i ≤ N`.
2. Given **L, R**: find the maximum value of `(A_i mod M)` across all `L ≤ i ≤ R`.

## Input

- The first line of each test case contains 3 integers - **N**, **M** and **Q**.
- The next **Q** lines each contain 3 integers in one of the 2 following formats:
  - `T = 1, X, Y`: representing an update with parameters **X** and **Y**.
  - `T = 2, L, R`: representing a query with parameters **L** and **R**.

## Output

For each test case, output on a new line the maximum value of **A<sub>i</sub> (mod M)** for `L ≤ i ≤ R` for each query.

## Constraints

- `1 ≤ N, Q ≤ 5 · 10^5`
- `1 ≤ M ≤ 10^9`
- **M** is prime
- `1 ≤ T ≤ 2`
- `1 ≤ X, Y ≤ 10^9`
- `1 ≤ L ≤ R ≤ N`

## Example

**Input**

```
5 37 6
1 2 7
1 9 13
2 2 4
1 29 3
2 1 3
2 3 5
```

**Output**

```
34
26
35
```

## Note

**Test Case 1:** The array changes in the first 3 steps as follows:

- **Update 1:** The array is updated to `[2, 9, 16, 23, 30]`.
- **Update 2:** The array is updated to `[11, 31, 51, 71, 91]`.
- **Query 1:** `A_2 (mod 37) = 14`, `A_3 (mod 37) = 34`, `A_4 (mod 37) = 17`. Thus, the maximum is 34.
