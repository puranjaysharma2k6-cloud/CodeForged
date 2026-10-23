# C. Composite Madness

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

You really like composite numbers. Therefore, you call a number **N** *good* if and only if it can be decomposed into **K** (`K ≥ 1`) composite numbers **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>K</sub>** satisfying the following conditions:

- `A_1 + A_2 + ... + A_K = N`
- Each **A<sub>i</sub>** is composite.

Given a number **N**, check if it is *good*.

> **Definition:** An integer **X** is said to be composite if and only if there exists some integer **Y** such that **Y** divides **X** and `1 < Y < X`. Notably, 1 is not composite.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- The first and only line of input of each test case contains a single integer **N**.

## Output

For each test case, output `Yes` if **N** is *good*, otherwise `No`.

It is allowed to output each character in either lower or upper case. For example, `YES`, `yes` and `yEs` will all be taken as positive responses.

## Constraints

- `1 ≤ T ≤ 1000`
- `1 ≤ N ≤ 10^9`

## Example

**Input**

```
3
52
4
5
```

**Output**

```
Yes
Yes
No
```

## Note

**Test Case 1:** We can decompose 52 into `(25 + 27)`, both of which are composite. Thus, 52 is a *good* number.

**Test Case 2:** We decompose 4 into `(4)` only, which is composite. Thus, 4 is a *good* number.
