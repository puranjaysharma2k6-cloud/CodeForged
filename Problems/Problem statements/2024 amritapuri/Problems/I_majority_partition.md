# I. Majority Partition

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

An integer **X** is the **majority** of sequence **B** if it occurs **strictly more** than **|B| / 2** times, where **|B|** represents the length of **B**.

A sequence **B** is considered *awesome* if it contains an element **X** which is a **majority**.

You are given a sequence **A** of length **N**. You must partition **A** into several subsequences such that:

- Each element is included in exactly one subsequence. Note that elements in a subsequence are not required to be adjacent.
- Every subsequence is *awesome*.

Output the minimum number of subsequences that you must partition **A** into. It can be shown it is always possible to partition **A** into some number of subsequences such that both conditions are satisfied.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of each test case contains **N** - the size of the array.
  - The second line contains **N** integers - **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>N</sub>**.

## Output

For each test case, output on a new line the minimum number of subsequences that you must partition **A** into.

## Constraints

- `1 ≤ T ≤ 10^4`
- `1 ≤ N ≤ 2 · 10^5`
- `1 ≤ A_i ≤ N`
- The sum of **N** over all test cases does not exceed `2 · 10^5`.

## Example

**Input**

```
3
4
1 2 3 4
4
1 1 1 2
6
1 1 2 2 3 3
```

**Output**

```
4
1
2
```

## Note

**Test Case 1:** The optimal and only valid division is `[1]`, `[2]`, `[3]` and `[4]`.

**Test Case 2:** The whole array can be taken as one sequence as 1 is a majority element.
