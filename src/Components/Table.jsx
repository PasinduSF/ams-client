'use client'
import React from 'react'

function Table({tableColumns,tanleRows}) {
    return (
            <table className="w-full text-sm text-left rtl:text-right text-black ">
                <thead className="text-[14px]  capitalize bg-gray-50 text-black">
                    <tr>
                        {tableColumns.map((column) => (
                            <th key={column.id} scope="col" className="px-6 py-3">
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tanleRows.map((row, index) => (
                        <tr key={index} className="bg-white border-b ">
                            {tableColumns.map((column) => (
                                <td key={column.id} className="px-6 py-4">
                                    {column.render ? column.render(row) : row[column.id]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
    )
}

export default Table