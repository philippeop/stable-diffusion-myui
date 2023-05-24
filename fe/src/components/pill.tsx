'use client';
import classNames from "classnames";
import { PropsWithChildren } from "react";

import config from '../../config.json'

interface PillProps extends PropsWithChildren {
    negative?: boolean
}
export default function Pill(props: PillProps) {

    const { mild, nsfw, quality_bad, quality_good, typos, lora } = config.pill_keyword_categories
    let is_nsfw, is_mild, is_quality_good, is_quality_bad, is_typo, is_lora;
    if(typeof props.children === 'string') {
        const keyword = (props.children as string).toLowerCase().trim();
        is_nsfw = !!nsfw.find(s => keyword.includes(s))
        is_mild = !!mild.find(s => keyword.includes(s))
        is_quality_good = !!quality_good.find(s => keyword.includes(s))
        is_quality_bad = !!quality_bad.find(s => keyword.includes(s))
        is_typo = !!typos.includes(keyword)
        is_lora = !!lora.includes(keyword)
    }
    const classes = classNames({
        'pill': true,
        'negative': props.negative,
        is_nsfw,
        is_mild,
        is_quality_good,
        is_quality_bad,
        is_typo,
        is_lora,
    })

    return (
        <div className={classes}>{props.children}</div>
    )

}