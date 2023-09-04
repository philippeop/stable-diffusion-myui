'use client';
import classNames from "classnames";

import config from '../../config.json'
import { PropsWithChildren } from 'react';

interface TagProps extends PropsWithChildren {
    title?: string
    type: string
    dimmed?: boolean
    onClick?: () => void
}
export default function Tag(props: TagProps) {
    const { title, type, dimmed, onClick, children } = props

    const classes = classNames({
        'tag': true,
        [type]: !!type,
        'dimmed': dimmed,
    })

    return (
        <div className={classes} title={title} onClick={() => onClick && onClick()}>
            {children}
        </div>
    )

}