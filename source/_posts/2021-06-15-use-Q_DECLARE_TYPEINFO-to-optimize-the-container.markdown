---
author: admin
comments: true
layout: post
slug: 'Use Q_DECLARE_TYPEINFO to let Qt optimize the container algorithm'
title: 使用Q_DECLARE_TYPEINFO让Qt优化容器算法
date: 2021-06-15 11:39:02
categories:
- CPP
---

如果需要使用Qt容器，那么使用`Q_DECLARE_TYPEINFO`让Qt了解容器内元素的类型特征是一个不错的做法。因为Qt可以通过识别`Q_DECLARE_TYPEINFO`给定的类型特征，在容器中采用不同的算法和内存模型以达到计算速度和内存使用上的优化。

`Q_DECLARE_TYPEINFO(Type, Flags)`的使用非常简单，在定义了数据结构之后，通过指定类型名和枚举标识来指定这个类型特征，例如：

``` c++
struct Point2D
{
    int x;
    int y;
};

Q_DECLARE_TYPEINFO(Point2D, Q_PRIMITIVE_TYPE);
```

* `Q_PRIMITIVE_TYPE`指定Type是没有构造函数或析构函数的POD(plain old data) 类型，并且`memcpy()`可以这种类型创建有效的独立副本的对象。
* `Q_MOVABLE_TYPE`指定Type具有构造函数或析构函数，但可以使用`memcpy()`在内存中移动。注意：尽管有叫做move，但是这个和移动构造函数或移动语义无关。
* `Q_COMPLEX_TYPE`（默认值）指定Type具有构造函数和析构函数，并且可能不会在内存中移动。

再来看看`Q_DECLARE_TYPEINFO`的具体实现：

``` c++
template <typename T>
class QTypeInfo
{
public:
    enum {
        isSpecialized = std::is_enum<T>::value, // don't require every enum to be marked manually
        isPointer = false,
        isIntegral = std::is_integral<T>::value,
        isComplex = !qIsTrivial<T>(),
        isStatic = true,
        isRelocatable = qIsRelocatable<T>(),
        isLarge = (sizeof(T)>sizeof(void*)),
        isDummy = false, 
        sizeOf = sizeof(T)
    };
};

#define Q_DECLARE_TYPEINFO_BODY(TYPE, FLAGS) \
class QTypeInfo<TYPE > \
{ \
public: \
    enum { \
        isSpecialized = true, \
        isComplex = (((FLAGS) & Q_PRIMITIVE_TYPE) == 0) && !qIsTrivial<TYPE>(), \
        isStatic = (((FLAGS) & (Q_MOVABLE_TYPE | Q_PRIMITIVE_TYPE)) == 0), \
        isRelocatable = !isStatic || ((FLAGS) & Q_RELOCATABLE_TYPE) || qIsRelocatable<TYPE>(), \
        isLarge = (sizeof(TYPE)>sizeof(void*)), \
        isPointer = false, \
        isIntegral = std::is_integral< TYPE >::value, \
        isDummy = (((FLAGS) & Q_DUMMY_TYPE) != 0), \
        sizeOf = sizeof(TYPE) \
    }; \
    static inline const char *name() { return #TYPE; } \
}

#define Q_DECLARE_TYPEINFO(TYPE, FLAGS) \
template<> \
Q_DECLARE_TYPEINFO_BODY(TYPE, FLAGS)
```

可以看出`Q_DECLARE_TYPEINFO`是一个典型的模板特化和模板enum hack结合的例子，代码使用宏`Q_DECLARE_TYPEINFO_BODY`定义了一个`QTypeInfo`的特化版本`class QTypeInfo<TYPE >`，并且使用定义给定的标志，计算出了一系列枚举值，例如`isComplex`、`isStatic`等。

Qt预定义了自己类型的`QTypeInfo`以便让它们在容器中获得更高的处理效率，例如：

``` c++
// 基础类型
Q_DECLARE_TYPEINFO(bool, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(char, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(signed char, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(uchar, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(short, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(ushort, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(int, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(uint, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(long, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(ulong, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(qint64, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(quint64, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(float, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(double, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(long double, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(char16_t, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(char32_t, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(wchar_t, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(long double, Q_PRIMITIVE_TYPE);

// Qt类型
Q_DECLARE_TYPEINFO(QFileSystemWatcherPathKey, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QLoggingRule, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QProcEnvKey, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QProcEnvValue, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QResourceRoot, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QConfFileCustomFormat, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QSettingsIniKey, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QSettingsIniSection, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QSettingsKey, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QSettingsGroup, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QModelIndex, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QItemSelectionRange, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QBasicTimer, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(pollfd, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(QSocketNotifierSetUNIX, Q_PRIMITIVE_TYPE);
Q_DECLARE_TYPEINFO(Variable, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QMetaMethod, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QMetaEnum, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QMetaClassInfo, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QArgumentType, Q_MOVABLE_TYPE);
Q_DECLARE_TYPEINFO(QCustomTypeInfo, Q_MOVABLE_TYPE);
...
    
// Qt容器类型
Q_DECLARE_MOVABLE_CONTAINER(QList);
Q_DECLARE_MOVABLE_CONTAINER(QVector);
Q_DECLARE_MOVABLE_CONTAINER(QQueue);
Q_DECLARE_MOVABLE_CONTAINER(QStack);
Q_DECLARE_MOVABLE_CONTAINER(QSet);
Q_DECLARE_MOVABLE_CONTAINER(QMap);
Q_DECLARE_MOVABLE_CONTAINER(QMultiMap);
Q_DECLARE_MOVABLE_CONTAINER(QHash);
Q_DECLARE_MOVABLE_CONTAINER(QMultiHash);
```

最后让我们来看看Qt容器如何利用`QTypeInfo`来优化容器算法的。以我们之前介绍过的`QList`为例，`QList`会因为类型大小的不同采用不同的内存布局和构造方法：

``` c++
template <typename T>
Q_INLINE_TEMPLATE void QList<T>::node_construct(Node *n, const T &t)
{
    if (QTypeInfo<T>::isLarge || QTypeInfo<T>::isStatic) n->v = new T(t);
    else if (QTypeInfo<T>::isComplex) new (n) T(t);
#if (defined(__GNUC__) || defined(__INTEL_COMPILER) || defined(__IBMCPP__)) && !defined(__OPTIMIZE__)
    else *reinterpret_cast<T*>(n) = t;
#else
    else ::memcpy(n, static_cast<const void *>(&t), sizeof(T));
#endif
}

template <typename T>
Q_INLINE_TEMPLATE void QList<T>::node_destruct(Node *n)
{
    if (QTypeInfo<T>::isLarge || QTypeInfo<T>::isStatic) delete reinterpret_cast<T*>(n->v);
    else if (QTypeInfo<T>::isComplex) reinterpret_cast<T*>(n)->~T();
}

template <typename T>
Q_INLINE_TEMPLATE void QList<T>::node_copy(Node *from, Node *to, Node *src)
{
    Node *current = from;
    if (QTypeInfo<T>::isLarge || QTypeInfo<T>::isStatic) {
        QT_TRY {
            while(current != to) {
                current->v = new T(*reinterpret_cast<T*>(src->v));
                ++current;
                ++src;
            }
        } QT_CATCH(...) {
            while (current-- != from)
                delete reinterpret_cast<T*>(current->v);
            QT_RETHROW;
        }

    } else if (QTypeInfo<T>::isComplex) {
        QT_TRY {
            while(current != to) {
                new (current) T(*reinterpret_cast<T*>(src));
                ++current;
                ++src;
            }
        } QT_CATCH(...) {
            while (current-- != from)
                (reinterpret_cast<T*>(current))->~T();
            QT_RETHROW;
        }
    } else {
        if (src != from && to - from > 0)
            memcpy(from, src, (to - from) * sizeof(Node));
    }
}
```

根据以上代码可以看出，`QList`根据`QTypeInfo`中`isLarge`、`isStatic`和`isComplex`的不同采用不同的构造析构和拷贝方法。以构造为例，当表达式`QTypeInfo<T>::isLarge || QTypeInfo<T>::isStatic`计算结果为`true`时，`QList`从堆里分配新内存并且构造对象存储在`node`中。当`QTypeInfo<T>::isComplex`的计算结果为`true`时，`QList`采用Placement new的方式直接使用`node`内存构造对象。除此之外则简单粗暴的拷贝内存到`node`内存上。析构和拷贝也有相似处理，阅读代码很容易理解其中的含义。

我们应该怎么做？Qt默认情况下会认为类型特征`isStatic`为`true`，这会导致一些不必要的性能下降，例如`QList`会无视类型大小，采用从堆重新分配内存构造对象。所以我们应该做的是充分理解我们的对象类型是否可以安全的移动，如果可以移动请使用`Q_DECLARE_TYPEINFO(TYPE, Q_MOVABLE_TYPE);`告知Qt，这样当对象长度小于指针长度的时候，Qt可以避免访问堆来分配内存，并且直接利用已有内存，对于频繁发生的小尺寸对象的操作这种优化是非常巨大的。

```
Run on (8 X 3600 MHz CPU s)
CPU Caches:
  L1 Data 32 KiB (x4)
  L1 Instruction 32 KiB (x4)
  L2 Unified 256 KiB (x4)
  L3 Unified 8192 KiB (x1)
-----------------------------------------------------------------------------------
Benchmark                                         Time             CPU   Iterations
-----------------------------------------------------------------------------------
BM_QListPushString/iterations:10000000          152 ns          150 ns     10000000
BM_QVectorPushString/iterations:10000000        102 ns          102 ns     10000000
BM_QListPushChar/iterations:10000000           12.2 ns         12.5 ns     10000000
BM_QVectorPushChar/iterations:10000000         4.92 ns         4.69 ns     10000000
```

详细可以阅读前面的文章《`QList` 的工作原理和运行效率浅析》。