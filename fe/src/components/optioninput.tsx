
import { Logger } from '@/common/logger'
import classNames from "classnames"
import { ChangeEvent, useCallback } from "react"

type InputType = string | number | undefined
type InputTypeString = 'text' | 'number' | 'number?'

interface OptionInputProps {
    id: string
    type: InputTypeString
    value: InputType
    dimOnEmpty: boolean
    emptyValue: number
    classNameExtra: string
    onChange: (newValue: string) => void
}
export default function OptionInput(props: OptionInputProps) {
    const { id, type, value, classNameExtra, dimOnEmpty, emptyValue, onChange } = props
    const internalOnInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value
        if(!isValid(value, type)) {
            event.preventDefault()
            event.stopPropagation()
            return
        }
        onChange(value)
    }, [onChange])

    // const finalValue = isValid(value, type) ? value : getDefault(type)
    const empty = dimOnEmpty && value === emptyValue
    Logger.log('value is', value, empty)
    const classes = classNames({
        [classNameExtra]: true,
        'option-input': true,
        'dimmed': dimOnEmpty && empty
    })
    Logger.log(classes)
    return (
        <input type="text" id={id} className={classes} value={value === emptyValue ? '' : value} onInput={internalOnInput}></input>
    )
}

function isValid(value: string | undefined | number, type: InputTypeString) {
    return (type === 'number'  && !isNaN(Number(value))) ||
           (type === 'number?' && (!isNaN(Number(value)) || value === ''))
}

function getDefault(type: InputTypeString) {
    if(type === 'number') return 0
    return ''
}