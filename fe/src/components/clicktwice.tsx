import classNames from 'classnames';
import { PropsWithChildren, useCallback, useRef, useState } from 'react'

interface ClickTwiceProps extends PropsWithChildren {
    id?: string
    styleIdle: string
    styleHot: string
    onClickTwice: () => void
}
export function ClickTwice(props: ClickTwiceProps) {
    const { styleIdle, styleHot, onClickTwice, children } = props;

    const timer = useRef<NodeJS.Timeout>()
    const [clickedOnce, setClickedOnce] = useState<boolean>()
    const onClick = useCallback(() => {
        if (!clickedOnce) {
            timer.current = setTimeout(() => { setClickedOnce(false) }, 2000)
            setClickedOnce(true)
            return () => clearTimeout(timer.current)
        }
        clearTimeout(timer.current)
        onClickTwice()
    }, [clickedOnce])

    const className = classNames({
        [styleIdle]: !clickedOnce,
        [styleHot]: clickedOnce
    })

    return (<div className={className} onClick={() => onClick()}>
        {children}
    </div>)
}

export function ClickTwiceButton(props: ClickTwiceProps) {
    const { id, styleIdle, styleHot, onClickTwice, children } = props;

    return (
        <ClickTwice id={id} styleIdle={'button ' + styleIdle} styleHot={'button ' + styleHot} onClickTwice={onClickTwice}>
            <div className="button-inner">
                {children}
            </div>
        </ClickTwice>
    )
}