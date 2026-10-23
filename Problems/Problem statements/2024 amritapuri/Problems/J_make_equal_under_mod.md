# J. Make Equal Under Mod

**Time limit:** 2 seconds  
**Memory limit:** 1.5 GB

You have an array **A** consisting of **N** integers. You can do the following operation as many times as you want:

- Choose **i** and **X** satisfying `1 ≤ i ≤ N` and `1 ≤ X ≤ 10^7`, and change **A<sub>i</sub>** to **A<sub>i</sub> mod X**.

It can be proven that it is possible to make all elements of **A** equal.

Let **f(A)** denote the maximum possible value of **A<sub>1</sub>** after all the elements of **A** have been made equal.

As usual, you have to solve a harder version of this task. Given an array **A** of **N** integers, find the sum of all answers over all subarrays of **A**, i.e.

> **∑<sub>L=1</sub><sup>N</sup> ∑<sub>R=L</sub><sup>N</sup> f([A<sub>L</sub>, A<sub>L+1</sub>, ..., A<sub>R</sub>])**

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of each test case contains **N** - the length of the array **A**.
  - The second line contains **N** integers - **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>N</sub>**.

## Output

For each test case, on a new line output the sum of **f** over all subarrays of **A**.

## Constraints

- `1 ≤ T ≤ 10^4`
- `1 ≤ N ≤ 2 · 10^5`
- `1 ≤ A_i ≤ 10^7`
- The sum of **N** does not exceed `2 · 10^5`.

## Example

**Input**

```
5
2
1 2
3
2 1 3
3
4 4 3
5
2 3 1 4 2
5
3 7 7 3 3
```

**Output**

```
3
7
17
15
57
```

## Note

**Test Case 1:** There are 3 subarrays of **A**:

- `[1]`: No operations needed. Array elements are all already equal. `f([1]) = 1`.
- `[2]`: No operations needed. Array elements are all already equal. `f([2]) = 2`.
- `[1, 2]`: First choose `i = 1, X = 1`, and then `i = 2, X = 1`. This changes the array to `[0, 0]` and it can be proven to be optimal. `f([1, 2]) = 0`.

Thus, the sum of **f** over all subarrays is 3.
