---
title: 课程资料勘误
corrections:
  - title: "Lecture行列式讲义第2页笔误"
    date: "2026-03-09"
    thanks: "徐彤佳"
    content: |
      第2页三阶行列式的计算中，$\det(A)$的第五项$-a_{12}a_{23}a_{31}$应为$-a_{12}a_{21}a_{33}$，即公式应为:

      $$\det(A) = a_{11}a_{22}a_{33} + a_{12}a_{23}a_{31} + a_{13}a_{21}a_{32} - a_{11}a_{23}a_{32} - a_{12}a_{21}a_{33} - a_{13}a_{22}a_{31}$$
    
  - title: "Lecture讲义2第5页笔误"
    date: "2026-03-10"
    content: |
      第5页中第一个等式，消去矩阵乘以(8)的左侧系数矩阵，得到(10)的左侧系数矩阵应为：

      $$   \begin{bmatrix} 1 & 0 & 0 \\ -2 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}\begin{bmatrix} 2 & 4 & -2 \\ 4 & 9 & -3 \\ -2 & -3 & 7\end{bmatrix} \begin{bmatrix}2 & 4 & -2 \\ 0 & 1 & 1 \\ -2 & -3 & 7 \end{bmatrix}.$$
  
  - title: "Lecture讲义3第4页笔误（3月23日再更新）"
    date: "2026-03-23"
    thanks: "徐彤佳"
    content: |
      第4页二阶矩阵的计算中，其逆矩阵必须满足应为：

      $$ A^{-1}A=I \quad \Longrightarrow \quad \begin{array}{rcc}ax+cy & = & 1 \\bx+dy & = & 0 \\az+cw & = & 1 \\ bz+dw & = & 0 \\ \end{array}$$ 
      
      第4页二阶矩阵的逆矩阵里，$x,y,z,w$ 的解缺少了一个系数，即：
      
      $$ x=\frac{1}{ad-bc}\cdot d,\ y=\frac{1}{ad-bc}\cdot (-b),\ z=\frac{1}{ad-bc}\cdot (-c),\ w=\frac{1}{ad-bc}\cdot a $$

  - title: "PPT课件2第20页笔误"
    date: "2026-03-16"
    thanks: "冯驰元"
    content: |
      第20页消元法解方程的矩阵形式中，应为：

      $$ \begin{bmatrix}
            2 & 4 & -2\\
            4 & 9 & -3\\
            2 & -2 & 4
        \end{bmatrix}\begin{bmatrix}
            x\\y\\z
        \end{bmatrix}=\begin{bmatrix}
            2\\8\\10
        \end{bmatrix}
        \qquad\Longrightarrow\qquad
        \begin{bmatrix}
            2 & 4 & -2\\
            0 & 1 & 1\\
            0 & 0 & 4
        \end{bmatrix}\begin{bmatrix}
            x\\y\\z
        \end{bmatrix}=\begin{bmatrix}
            2\\4\\8
        \end{bmatrix} $$
    
  -  title: "Lecture 7讲义第9页笔误"
     date: "2026-04-20"
     thanks: "鲁芷仪"
     content: |
      第9页证明行交换不改变列秩的时候，比较应该是 $A$ 和 $A'$的第$k$个向量 $\mathbf{a}_k$和$\mathbf{a}'_k$：

      $$ \begin{aligned}
                    \mathbf{a}_k&=\begin{bmatrix}
                        a_{1k}&\ldots &{\color{red}a_{ik}}&\ldots &{\color{red}a_{jk}}&\ldots &a_{nk}
                    \end{bmatrix}^T\\  
                    \mathbf{a}'_k&=\begin{bmatrix}
                        a_{1k}&\ldots &{\color{red}a_{jk}}&\ldots &{\color{red}a_{ik}}&\ldots &a_{nk}
                    \end{bmatrix}^T
                \end{aligned} $$
      
      原来的版本下标有误，现已更正。

  -  title: "Lecture 8讲义第5页证明错误"
     date: "2026-04-20"
     content: |
      第5页关于引理 1.9 的 4: $(V^{\bot})^{\bot}=V$ 证明有误，新版本已经更正。
  
  - title: "Lecture 9 讲义第1页笔误"
    date: "2026-05-07"
    thanks: "鲁芷仪"
    content: |
      第1页倒数第六行，第二个方程应该为：

      $$\begin{bmatrix} 1 & 1 & 1\\1 & 1 & 1\\  4 & 2 & 1\\ 4 & 2 & 1\end{bmatrix}\begin{bmatrix}a\\b\\c\end{bmatrix}=\begin{bmatrix} 2\\3\\4\\5 \end{bmatrix}$$
 
  - title: "Lecture 行列式 讲义第18页、第20页笔误"
    date: "2026-05-19"
    thanks: "徐彤佳"
    content: |
       讲义第18页第7行，“从而由行列式的线性性，我们有”下面的公式中

       $${\color{red}e_1} \text{应为} {\color{red}e_i}.$$

       讲义第20页例2.20 中 置换 $\sigma_0$的第四个逆序对应该是 $(2,3)$，不是 $(2,1)$.

       讲义第20页逆序数的重要性质中，第三个例子应为：

       $$\tau(3241)=4 \Longrightarrow 3241\rightarrow 3214\rightarrow 2314\rightarrow 2134\rightarrow 1234 $$

  - title: "Lecture 行列式 讲义第25页笔误"
    date: "2026-05-25"
    thanks: "余欣怡"
    content: |
      第25页定理2.30 中矩阵 $A$ 的最后一行第一个元素应该为 $a_{n1}$，原先 $a_{11}$ 是笔误，新版本已经更正。

  - title: "Lecture 12 讲义第2页笔误"
    date: "2026-05-29"
    thanks: "余欣怡"
    content: |
      第2页加粗特征值和特征向量中，应为：

      $$ AX^{-1}=\begin{bmatrix} A\mathbf{x}_1 & A\mathbf{x}_2\end{bmatrix}=X^{-1}\begin{bmatrix}\lambda_1 & 0\\ 0& \lambda_2\end{bmatrix}=\begin{bmatrix} \mathbf{x}_1 &\mathbf{x}_2 \end{bmatrix}\begin{bmatrix}\lambda_1 & 0\\ 0& \lambda_2\end{bmatrix}=\begin{bmatrix}  \lambda_1\mathbf{x}_1 &\lambda_2\mathbf{x}_2\end{bmatrix} $$

      和

      $${\color{red}A\mathbf{x}_1=\lambda_1\mathbf{x}_1,\quad  A\mathbf{x}_2=\lambda_2\mathbf{x}_2}$$

      原先的版本有些下标书写不正确。

  - title: "Lecture 讲义笔误修订合集"
    date: "2026-06-19"
    thanks: "徐彤佳"
    content: |
       讲义III 第3页，例1.3中矩阵乘法的结果第2行第3列应是-4，而不是-6.

       讲义IV 第10页，例2.9中矩阵 $A$的左零空间仅由$\begin{bmatrix} -2\\1\end{bmatrix}$ 生成。

       讲义V 第5页，最后两行应为： $S'$ 称为 $V$ 的基，$S'$的个数称为 $V$ 的维度。

       讲义V 第6页，例2.7的2中， $L_2$ 是线性无关的。

  - title: "Lecture 讲义笔误修订合集"
    date: "2026-06-23"
    thanks: "鲁芷仪"
    content: |
       讲义VII 第6页，第4行 $R$ 的 rank、row-rank和column-rank 都应该为 4，而不是3.

       讲义VIII 第5页，例1.12 中的1，在例1.5中应该是 $V_3^{\perp}= V_5$，而不是 $V_4$.



---
