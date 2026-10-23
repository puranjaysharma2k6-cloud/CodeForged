# E. Expected Rain

**Time limit:** 2 seconds  
**Memory limit:** 1.5 GB

There are **N** buildings on a 1-D line. The i-th building spans from x-coordinate **(i - 1)** to x-coordinate **i**, and has a height of **H<sub>i</sub>**.

When rain falls, water gets collected between the buildings. There are no buildings to the left of `x = 0` or to the right of `x = N`, and so no water gets collected there.

Let **f(H)** denote the amount of rain collected.

Unfortunately, you only remember the **N** heights, but not the order in which they were present. Find the expected value of **f(H)** over all possible permutations of **H**.

The expected value must be computed modulo **998244353**.

Formally, it can be proven that the answer can be represented as a rational number **P / Q** where `Q ≢ 0 (mod 998244353)`. Find the unique integer **R** in `[0, 998244353)` such that `R · Q ≡ P (mod 998244353)`.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of each test case contains a single integer **N** - the number of buildings.
  - The second line of each test case contains **N** space-separated integers - **H<sub>1</sub>, H<sub>2</sub>, ..., H<sub>N</sub>**.

## Output

For each test case, output on a new line the expected value of the collected rain modulo **998244353**.

## Constraints

- `1 ≤ T ≤ 10^4`
- `1 ≤ N ≤ 5 · 10^5`
- `1 ≤ H_i ≤ N`
- The sum of **N** over all test cases does not exceed `5 · 10^5`

## Example

**Input**

```
4
2
1 2
3
3 2 1
4
1 1 2 2
5
1 2 3 4 5
```

**Output**

```
0
332748118
665496236
798595485
```

## Note

**Test Case 1:** There are 2 possible rearrangements. Both have no collected rain. Hence the answer is 0.

**Test Case 2:** There are 6 permutations possible. `[2, 1, 3]` and `[3, 1, 2]` both have collected rain of 1 unit, and the other 4 have 0 collected rain. Hence, the answer is `2/6 ≡ 332748118 (mod 998244353)`.
