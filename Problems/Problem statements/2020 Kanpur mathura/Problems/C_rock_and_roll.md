# C. Rock and Roll

**Time limit:** 1 second  
**Memory limit:** 2048 MB

A ball is dropped from point **P** on an inclined surface with an inclination angle of **θ degrees**. At first the ball hits the surface at point **A** from height **H meter** at **time = 0**. At **time = T seconds** the ball is at point **B**. You have to find the distance of point **B** from point **A** in **meter**.

You may assume that the gravitational acceleration (**g = 10 m/s²**) is constant everywhere, all collisions are perfectly elastic, air resistance is negligible, the inclined surface is infinitely large and the ball is a point object.

> **Note:** the image in the original statement is not drawn to scale and is only for illustration purposes. (Ball dropped from P, hits the incline at A at t = 0, bounces down the slope, and is at B at t = T.)

## Input

The first line contains one integer **N** denoting the number of test cases.

Each of the next **N** lines contains three integers denoting **H**, **T**, **θ** respectively.

## Constraints

- `1 ≤ N ≤ 10^5`
- `1 ≤ H ≤ 100`
- `1 ≤ T ≤ 100`
- `0 < θ < 90`

## Output

For each test case, print one line containing a real number denoting the distance from point A to point B.

Your answer is considered correct if its absolute or relative error doesn't exceed `10^-6`.

## Example

**Input**

```
4
1 1 45
1 2 45
1 3 45
1 10 45
```

**Output**

```
6.704280537837
20.473046133885
41.311703351602
385.176394103919
```
