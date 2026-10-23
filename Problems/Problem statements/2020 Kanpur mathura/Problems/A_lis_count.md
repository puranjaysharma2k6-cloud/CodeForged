# A. LIS Count

**Time limit:** 1 second  
**Memory limit:** 2048 MB

Given a permutation, you can easily find its LIS (Longest Increasing Subsequence).

You can also find the number of subsequences which is a LIS of the given permutation.

But the life of a programmer is not so easy, huh!

So, given a number **C**, you have to find **a permutation** such that **the number of LIS in this permutation is C**.

## Input

The first line contains the number of test cases **T** (`1 ≤ T ≤ 5000`).

The following **T** lines each contain a single integer **C** (`1 ≤ C ≤ 10^18`).

## Output

For each test case, find a permutation that has the desired LIS count and output two lines:

- The first line should contain the size of the permutation **N** (`1 ≤ N ≤ 200`).
- The second line should contain **N** distinct integers **a<sub>i</sub>** (`1 ≤ a_i ≤ N`) denoting the permutation.

If there are many solutions, you can print any of them. If there is no such permutation, print `-1` in a single line (without the quotes).

## Example

**Input**

```
2
2
1
```

**Output**

```
7
4 2 7 1 3 5 6
4
1 2 3 4
```
