---
author: admin
comments: true
layout: post
slug: 'addition to rvo and copy elimination'
title: 返回值优化和拷贝消除的一点补充
date: 2022-06-01 21:17:10
categories:
- CPP
---

在我写的《现代C++语言核心特性解析》中有一个小节是讲解的返回值优化，在这篇文章中，我将对这部分内容进行一点补充，将更多细节展示出来。
首先还是来看看书中的这段代码：
```cpp
#include <iostream>
class X {
    public:
    X() { std::cout << "X ctor" << std::endl; }
    X(const X& x) { std::cout << "X copy ctor" << std::endl; }
    ~X() { std::cout << "X dtor" << std::endl; }
};
X make_x() {
    X x1;
    return x1;
}
int main() {
    X x2 = make_x();
}

```
这段代码在开启和关闭拷贝消除的运行情况是不同的，不过书中只使用了两种情况讨论，但是实际上我漏掉了C++17关闭拷贝消除的情况，以下是正确的对比表格：

| 拷贝消除 | C++14 关闭拷贝消除 | C++17 关闭拷贝消除 |
| -------- | ------------------ | ------------------ |
| X ctor   | X ctor             | X ctor             |
| X dtor   | X copy ctor        | X copy ctor        |
|          | X dtor             | X dtor             |
|          | X copy ctor        | X dtor             |
|          | X dtor             |                    |
|          | X dtor             |                    |

可以看到C++17和C++14的行为是不同的。开启拷贝消除的很明显，优化让构造直接发生在`main`函数中：
```cpp
make_x(): # @make_x()
  push rbx
  mov rbx, rdi
  call X::X() [base object constructor]
  mov rax, rbx
  pop rbx
  ret
main: # @main
  push rbx
  sub rsp, 16
  lea rdi, [rsp + 8]
  call make_x()
```
C++14的行为也很明确，和书中介绍了一样，发生了三次构造：
```cpp
make_x(): # @make_x()
  push r14
  push rbx
  push rax
  mov rbx, rdi
  mov r14, rsp
  mov rdi, r14
  call X::X() [base object constructor]
  mov rdi, rbx
  mov rsi, r14
  call X::X(X const&) [base object constructor]
  mov rdi, rsp
  call X::~X() [base object destructor]
  mov rax, rbx
  add rsp, 8
  pop rbx
  pop r14
  ret
  
main: # @main
  push rbx
  sub rsp, 16
  mov rbx, rsp
  mov rdi, rbx
  call make_x()
  lea rdi, [rsp + 8]
  mov rsi, rbx
  call X::X(X const&) [base object constructor]
  mov rdi, rsp
  call X::~X() [base object destructor]
  lea rdi, [rsp + 8]
  call X::~X() [base object destructor]
  xor eax, eax
  add rsp, 16
  pop rbx
  ret
```
但是C++17的行为相对就比较奇怪了，关闭拷贝消除但并没有完全关闭：
```cpp
make_x(): # @make_x()
  push r14
  push rbx
  push rax
  mov rbx, rdi
  mov r14, rsp
  mov rdi, r14
  call X::X() [base object constructor]
  mov rdi, rbx
  mov rsi, r14
  call X::X(X const&) [base object constructor]
  mov rdi, rsp
  call X::~X() [base object destructor]
  mov rax, rbx
  add rsp, 8
  pop rbx
  pop r14
  ret

main: # @main
  push rbx
  sub rsp, 16
  lea rbx, [rsp + 8]
  mov rdi, rbx
  call make_x()
  mov rdi, rbx
  call X::~X() [base object destructor]
  xor eax, eax
  add rsp, 16
  pop rbx
  ret

```
只有两次构造，`x1`拷贝到临时对象，临时对象拷贝到`x2`的过程合并成了一次，也就是`x1`直接拷贝到了`x2`，这是为什么呢？
其实是因为C++17对临时对象进行了特殊规定：
> 6.7.7 Temporary objects [class.temporary]
> 
> The materialization of a temporary object is generally delayed as long as possible in order to avoid creating unnecessary temporary objects.
> 

在提案文档p0135r1中也对拷贝消除的描述进行了修改（[http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0135r1.html](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0135r1.html)
）。

至此，我们已经了解了C++17关闭拷贝消除后的特殊情况的因由。最后补充一点，关于拷贝消除，除了在返回值上可以做优化，还有下面这些情况都可以进行优化，当然有一些优化是没有实现的：
> 1. return语句中返回类类型，返回对象类型和函数返回类型相同，并且要求类型是非易失且有自动存储周期的对象。
> 1. throw表达式，操作数类型也要求是非易失且有自动存储周期的对象，并且作用域不超过最内侧的try。
> 1. 异常处理（其实就是try-catch中catch(){}），声明的对象如果和抛出对象类型相同，可以将声明对象看作抛出对象的别名，前提条件是这个对象在这个过程中除了构造和析构是不会被改变的。
> 1. 在协程中，协程参数的拷贝可以被忽略，也就是直接引用参数本身，当然也有前提条件，就是在处理对象的过程中除了构造和析构是不会被改变的。
> 

