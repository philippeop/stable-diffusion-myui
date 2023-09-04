
import { Logger } from '@/common/logger'
import classNames from "classnames"
import { ChangeEvent, useCallback } from "react"

type InputType = string | number | undefined
type InputTypeString = 'text' | 'number' | 'number?'

interface OptionInputProps {
    id: string
    type: InputTypeString
    value: InputType
    dimOnEmpty?: boolean
    emptyValue?: number
    hideEmpty?: boolean
    classNameExtra: string
    onChange: (newValue: string) => void
}
export default function OptionInput(props: OptionInputProps) {
    const { id, type, value, classNameExtra, dimOnEmpty = false, emptyValue = 0, hideEmpty = true, onChange } = props
    const internalOnInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value
        if (!isValid(value, type)) {
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
    const inputType = type === 'number' ? 'number' : 'text'
    return (
        <input type={inputType} id={id} className={classes} value={(hideEmpty && value === emptyValue) ? '' : value} onInput={internalOnInput}></input>
    )
}

function isValid(value: string | undefined | number, type: InputTypeString) {
    if (type === 'number') {
        return !isNaN(Number(value))
    }
    else if (type === 'number?') {
        return value !== ' ' &&
            (!isNaN(Number(value)) || value === '')
    }
    return true
}

function getDefault(type: InputTypeString) {
    if (type === 'number') return 0
    return ''
}