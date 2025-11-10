import React, { useState, useRef, useEffect } from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const ShearchPayment = ({ onSearch, placeholder = 'Tìm kiếm theo bàn hoặc khách...', style }) => {
    const [value, setValue] = useState('')
    const timer = useRef(null)

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [])

    const triggerSearch = (v) => {
        if (typeof onSearch === 'function') onSearch(String(v || '').trim())
    }

    const onChange = (e) => {
        const v = e.target.value
        setValue(v)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => triggerSearch(v), 300)
    }

    const onPressEnter = () => triggerSearch(value)

    return (
        <Input
            value={value}
            onChange={onChange}
            onPressEnter={onPressEnter}
            placeholder={placeholder}
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            allowClear
            style={{
                width: 360,
                height: 40,
                borderRadius: 8,
                border: '1px solid #e9e9e9',
                boxShadow: 'none',
                ...style
            }}
        />
    )
}

export default ShearchPayment