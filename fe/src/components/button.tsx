'use client';
import { PropsWithChildren } from 'react'

interface ButtonProps extends PropsWithChildren {
    id?: string
    onClick: () => void
}
export default function Button(props: ButtonProps) {
    const { id, children, onClick } = props
    return (
        <div className="button" id={id} onClick={() => onClick()}>
            <div className="button-inner">
                {children}
            </div>
        </div>
    )
}