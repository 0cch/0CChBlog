---
author: admin
comments: true
layout: post
slug: 'virtual function calls in constructors'
title: 关于构造函数中调用虚函数
date: 2022-07-03 10:38:00
categories:
- CPP
---


在我们学习C++编程的时候，通常都会被告诫：“不要在构造函数中调用虚函数”。为什么会有这样一条规则呢？从语法上来看，当构造函数的函数体执行的时候，该类的虚表和虚表指针应该已经准备就绪了，不会造成调用失败或者引发未定义行为，例如：

``` c++
#include <iostream>

class A
{
public:
  A()                { std::cout << "A()\n";      };
  virtual void foo() { std::cout << "A::foo()\n"; };
};

class B : public A
{
public:
  B() {
    std::cout << "B()\n";
    foo();
  };
  void foo() { std::cout << "B::foo()\n"; };
};

class C : public B
{
public:
  C()        { std::cout << "C()\n"; };
  void foo() { std::cout << "C::foo()\n"; };
};

int main()
{
  C x;
  return 0;
}
```

当然，它的派生类不会在此时构造好虚表指针，不可能调用到派生类的虚函数，所以上述代码会有如下的执行结果：

``` log
A()
B()
B::foo()
C()
```

这个结果显然是合理的，因为基类`B`在构造的时候，`C`还没有构造，这个时候调用`B`类的虚函数是安全的。那么回到开始的问题，为什么建议大家不要在构造函数中调用虚函数呢？我认为最重要的原因是他的行为跟通常使用虚函数的时候有一些差异，容易造成理解偏差。比如上面的代码，一般情况下，如果在`C`类构造完毕后调用`foo`函数，那么调用的必然是`C::foo()`这个函数。

另外，C++构造函数中调用虚函数和其他语言的行为也会有所不同，这也会造成程序员某种程度上的记忆偏差，最终导致程序设计出现问题。下面，我们以C#和Java为例来展示这种偏差：

``` c#
using System;

class Program
{
  class Base
  {
    public Base()
    {
      Test();
    }
    protected virtual void Test()
    {
      Console.WriteLine("From base");
    }
  }
  class Derived : Base
  {
    protected override void Test()
    {
      Console.WriteLine("From derived");
    }
  }
  static void Main(string[] args)
  {
    var obj = new Derived();
  }
}
```

编译运行这份C#代码，输出结果为：

``` log
From derived
```

再来看看Java的情况：

``` java
class Program {
    class Base {
        public Base() {
            Test();
        }
        protected void Test() {
            System.out.println("From base");
        }
    }
    class Derived extends Base {
        protected void Test() {
            System.out.println("From derived");
        }
    }
    public static void main(String args[]) {
        Program p = new Program();
        Program.Derived d = p.new Derived();
    }
}
```

编译运行这份代码，输出结果的和C#相同：

``` log
From derived
```

由此可见，这些不同的结果确实容易影响到程序员的记忆。

最后值得一提的是，C++的这种处理从安全性上更好，这一点非常明显，无论是C#还是Java，在基类中调用派生类虚函数或者说调用被派生类重写的方法，执行的代码都会在派生类构造之前执行，造成未定义的行为。
