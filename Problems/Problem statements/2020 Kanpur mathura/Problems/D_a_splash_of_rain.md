# D. A Splash of Rain

**Time limit:** 1 second  
**Memory limit:** 2048 MB

You have an array **A** (1-indexed) of **N** integers. You can perform any number of operations on this array. An operation goes like this:

1. You pick an index **i** such that `1 ≤ i ≤ n-2` and `a[i] + a[i+2] > a[i+1]`
2. Then you swap `a[i]` and `a[i+2]`

You have to output if you can sort the array in non-decreasing order after performing any number of operations.

## Input

The first line contains one integer **T** denoting the number of test cases.

For each test, the first line contains **N**, the size of the array. The next line contains **N** integers denoting the elements of the array.

## Constraints

- `1 ≤ T ≤ 10^5`
- `1 ≤ N ≤ 10^5`
- `1 ≤ Sum of N over all testcases ≤ 10^5`
- `1 ≤ A_i ≤ 10^9`

## Output

For each test case, print `YES` (without quotes) if it is possible to sort the array in non-decreasing order using any number of operations. Otherwise print `NO` (without quotes).

## Example

**Input**

```
3
2
12 10
4
4 2 3 1
4
3 4 1 2
```

**Output**

```
NO
NO
YES
```
