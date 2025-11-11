import React from 'react'
import { Select } from 'antd'
import { FilterOutlined } from '@ant-design/icons'

const { Option } = Select

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled']

const FilterPayment = ({ value, onChange, style, allowClear = true, placeholder = 'Lọc theo trạng thái' }) => {
    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            allowClear={allowClear}
            suffixIcon={<FilterOutlined />}
            style={{
                minWidth: 200,
                height: 40,
                borderRadius: 8,
                border: '1px solid #ff7a00',
                boxShadow: 'none',
                color: '#333',
                ...style
            }}
            dropdownMatchSelectWidth={false}
        >
            {STATUS_OPTIONS.map(s => (
                <Option key={s} value={s}>
                    {s}
                </Option>
            ))}
        </Select>
    )
}

export default FilterPayment