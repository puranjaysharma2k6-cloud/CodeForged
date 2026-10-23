# G. Infinite Operations

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

Alice has **N** boxes, numbered 1 to **N**, where the i-th box contains **A<sub>i</sub>** stones.

Alice can perform the following two-step operation:

1. Pick two different boxes, say **X** and **Y**, such that the number of stones in box **X** and box **Y** **are not equal**.
2. Then, move exactly 1 stone from the box with more stones to the box with lesser stones. For example, if `A_X > A_Y`, she will remove 1 stone from box **X** and place that stone in box **Y**.

Is it possible for her to choose operations such that she is able to continue doing this indefinitely?

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of input contains **N** - the number of boxes.
  - The second line of input contains **N** integers - **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>N</sub>**, the number of stones in each box.

## Output

For each test case, output on a new line `Yes` if Alice can continue doing operations infinitely, otherwise output `No`.

It is allowed to print each character in either case - `YES`, `yes`, and `yEs` will all be considered positive responses.

## Constraints

- `1 ≤ T ≤ 100`
- `2 ≤ N ≤ 100`
- `1 ≤ A_i ≤ 100`

## Example

**Input**

```
2
2
1 2
3
1 1 3
```

**Output**

```
Yes
Yes
```

## Note

**Test Case 1:** Alice can always choose boxes 1 and 2, and alternate between the states `[1, 2]` and `[2, 1]`.
