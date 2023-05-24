'use client';
import classNames from "classnames";
import { PropsWithChildren } from "react";

interface PillProps extends PropsWithChildren {
    negative?: boolean
}
export default function Pill(props: PillProps) {

    let is_nsfw, is_mild, is_quality_good, is_quality_bad, is_typo;
    if(typeof props.children === 'string') {
        const str = (props.children as string).toLowerCase().trim();
        is_nsfw = !!nsfw.find(s => str.includes(s))
        is_mild = !!mild.find(s => str.includes(s))
        is_quality_good = !!quality_good.find(s => str.includes(s))
        is_quality_bad = !!quality_bad.find(s => str.includes(s))
        is_typo = !!typos.includes(str)
    }
    const classes = classNames({
        'pill': true,
        'negative': props.negative,
        is_nsfw,
        is_mild,
        is_quality_good,
        is_quality_bad,
        is_typo
    })

    return (
        <div className={classes}>{props.children}</div>
    )

}

const nsfw = []

const mild = []

const quality_good = []

const quality_bad = []

const typos = []