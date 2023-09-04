import classNames from 'classnames';
import { PropsWithChildren, useCallback, useRef, useState } from 'react'

interface ClickTwiceProps extends PropsWithChildren {
    id?: string
    style?: string
    onClickTwice: () => void
}
export function ClickTwice(props: ClickTwiceProps) {
    const { style , onClickTwice, children } = props;

    const timer = useRef<NodeJS.Timeout>()
    const [clickedOnce, setClickedOnce] = useState<boolean>()
    const onClick = useCallback(() => {
        if (!clickedOnce) {
            timer.current = setTimeout(() => { setClickedOnce(false) }, 2000)
            setClickedOnce(true)
            return () => clearTimeout(timer.current)
        }
        setClickedOnce(false)
        clearTimeout(timer.current)
        onClickTwice()
    }, [clickedOnce])

    const className = classNames({
        [style ?? '']: true,
        'clicktwice': true,
        'hot': clickedOnce
    })

    return (<div className={className} onClick={() => onClick()}>
        {children}
    </div>)
}

export function ClickTwiceButton(props: ClickTwiceProps) {
    const { id, style, onClickTwice, children } = props;

    return (
        <ClickTwice id={id} style={'button ' + style} onClickTwice={onClickTwice}>
            {children}
        </ClickTwice>
    )
}