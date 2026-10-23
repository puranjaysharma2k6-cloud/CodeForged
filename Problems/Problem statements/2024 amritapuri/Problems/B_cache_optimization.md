# B. Cache Optimization

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

Cache optimizations can significantly impact program performance, often making a program run faster than anticipated. To illustrate this, let us consider a simplified model of a cache.

Suppose the cache has a size **K**. This means the cache can store the memory locations of up to **K** variables. If fewer than **K** variables have been accessed, the cache contains all of them only - in particular, the cache is empty before any variables are accessed.

When a new variable is accessed beyond the **K**-variable limit, the **least recently used** variable is removed from the cache to make space for the new one.

In this task, we simulate the behavior of a CPU cache to determine the total CPU cycles required for memory access.

- If the memory location of a variable is present in the cache, it takes **1** CPU cycle to access it.
- If the memory location is not in the cache, it takes **2** CPU cycles to retrieve it.

You have a list of **N** variables you will use in that order. Some of the variables might be repeated. You would like to compute the total number of CPU cycles the program will use. You may assume that the only time-consuming part is the memory accesses.

Further, the exact value of **K** is not known to you. So, we require you to solve the problem for each **K = 1, 2, ..., N**.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of each test case contains **N** - the number of variables.
  - The second line contains **N** integers, **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>N</sub>** - the IDs of the **N** variables.

## Output

For each test case, output **N** space-separated integers - the total CPU cycles taken for **K = 1, 2, ..., N** in that order.

## Constraints

- `1 ≤ T ≤ 10^4`
- `1 ≤ N ≤ 2 · 10^5`
- `1 ≤ A_i ≤ N`
- The sum of **N** over all test cases does not exceed `2 · 10^5`

## Example

**Input**

```
3
2
1 1
3
3 2 1
5
1 2 1 3 2
```

**Output**

```
3 3
6 6 6
10 9 8 8 8
```

## Note

**Test Case 3:** Let's solve the problem for **K = 2**.

- Initially, your cache is empty.
- You query for the location of the 1st variable. This is not present in your cache, so it takes 2 CPU cycles. Your cache is now `{1}`.
- You query for the location of the 2nd variable. This is not present in your cache, so it takes 2 CPU cycles. Your cache is now `{2, 1}`, ordered in descending order of recency.
- You query for the location of the 1st variable. This is present in your cache, so it takes 1 CPU cycle. Your cache is now `{1, 2}`, ordered in descending order of recency.
- You query for the location of the 3rd variable. This is not present in your cache, so it takes 2 CPU cycles. Further, this gets added to your cache, however it must remove one variable otherwise you exceed the `K = 2` limit. 2 gets removed from cache as 1 is more recent. Thus, your cache is `{3, 1}`, ordered in descending order of recency.
- You query for the location of the 2nd variable. This is not present in your cache, so it takes 2 CPU cycles. Your cache gets updated to `{2, 3}`.

Thus, the total is `2 + 2 + 1 + 2 + 2 = 9`.
