export * from './building';

export type Color = 'blue'
                  | 'indigo'
                  | 'purple'
                  | 'pink'
                  | 'red'
                  | 'orange'
                  | 'yellow'
                  | 'green'
                  | 'teal'
                  | 'cyan'
                  | 'white'
                  | 'gray'
                  | 'gray-dark'
                  | 'light'
                  | 'lighter'
                  | 'primary'
                  | 'secondary'
                  | 'success'
                  | 'info'
                  | 'warning'
                  | 'danger'
                  | 'light'
                  | 'dark'
                  | 'default'
                  | 'primary-light'
                  | 'warp'
                  | 'red'
                  | 'dark-red'
                  | 'blue'
                  | 'yellow'
                  | 'white'
                  | 'neutral'
                  | 'darker';

export const ROOM_NAME_REGEX = /^[a-zA-Z]{1,}\d{2,}[a-zA-Z]*$/;
export const URL_REGEX = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
export const NO_PROTOCOL_URL_REGEX = /([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?/;

/**
 * Returns the name of the last semester
 * depending on the current time.
 */
export const getLastSemester = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 0 && month <= 4)
        return 'fall ' + (year - 1);
    return 'spring ' + year;
}

/**
 * The name of the current semester (at the given date)
 * @param date an optional date, or now if not provided
 */
export const getCurrentSemester = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 0 && month <= 4)
        return 'spring ' + (year - 1);
    return 'fall ' + year;
}


/**
 * Ensures a number exists, since simply doing ``!!int`` or ``int``
 * will not always work (namely with ``0``, since ``!!0`` is false).
 * 
 * @param int the number to check
 */
export const numberProvided = (int: number | undefined | null) => {
    return int !== null && int !== undefined && int !== NaN;
}

/**
 * Adds a trailing decimal to the end of a number
 * if it does not already have one, and returns
 * it as a string.
 * 
 * @param int the number to apply a trailing decimal to
 */
export const addTrailingDecimal = (int: number) => {
    if (!int)
        return null;

    if (!int.toString().includes('.'))
        return int.toString() + '.0';

    return int.toString();
}

/**
 * Attempts to retrieve an enum key from a valid enum value.
 * 
 * @param target the target enum
 * @param value the value to search by
 */
export const getEnumKeyByEnumValue = (target: any, value: string, caseSensitive = true) => {
    let keys = Object
        .keys(target)
        .filter(x => caseSensitive
            ? target[x] == value
            : target[x].toLowerCase() == value.toLowerCase());

    return keys.length > 0
        ? keys[0]
        : undefined;
}

/**
 * Infers the expected icon for a given string or element.
 * 
 * @param input the inputted icon string or element
 * @param classes [optional] the classes to add to the icon if it is a string
 */
export const inferIcon = (input: string | JSX.Element, classes = 'fa-fw') => {
    if (input instanceof String) {
        let prefix = 'fa';
        if (input.startsWith('mdi'))
            prefix = 'mdi';

        return <i className={`${prefix} ${input} ${classes}`}></i>
    }

    return input;
}

/**
 * Capitalizes the first letter of all words in a string.
 * @param input the input string
 */
export const capitalizeFirst = (input: string) => input
    .split(' ')
    .map(str => str.charAt(0).toUpperCase() + str.slice(1))
    .join(' ');

/**
 * Flattens an array of any type into a single array.
 * @param arr the array to flatten
 */
export const flatten = (arr: any[]) => [].concat.apply([], arr);

/**
 * Sums the elements of a number array.
 * @param arr the array to sum
 */
export const sum = (arr: number[]) => arr
    .filter(ent => !isNaN(ent))
    .reduce((prev, cur) => cur + prev, 0);

/**
 * Prepends a zero to integers less than ten.
 * @param int the integer to format
 */
export const prependZero = (int: number) => int < 10 ? `0${int}` : `${int}`;

/**
 * Replaces all occurances of a given
 * search string within another string.
 * 
 * @param input the input string
 * @param search the string to replace
 * @param replace what to replace it with
 */
export const replaceAll = (input: string, search: string | RegExp, replace: string) => {
    let copy = String(input);
    if (search instanceof RegExp) {
        if (!search.test(copy))
            return copy;

        while (search.test(copy))
            copy = copy.replace(search, replace);

        return copy;
    }

    if (!copy.includes(search))
        return copy;

    while (copy.includes(search))
        copy = copy.replace(search, replace);

    return copy;
}

/**
 * Retrieves the formatted duration string
 * for the given millis duration input.
 * 
 * @param time the time in milliseconds
 */
 export const getLatestTimeValue = (time: number) => {
    let sec = Math.trunc(time / 1000) % 60;
    let min = Math.trunc(time / 60000 % 60);
    let hrs = Math.trunc(time / 3600000 % 24);
    let days = Math.trunc(time / 86400000 % 30.4368);
    let mon = Math.trunc(time / 2.6297424E9 % 12.0);
    let yrs = Math.trunc(time / 3.15569088E10);

    let y = `${yrs}y`;
    let mo = `${mon}mo`;
    let d = `${days}d`;
    let h = `${hrs}h`;
    let m = `${min}m`;
    let s = `${sec}s`;

    let result = '';
    if (yrs !== 0) result += `${y}, `;
    if (mon !== 0) result += `${mo}, `;
    if (days !== 0) result += `${d}, `;
    if (hrs !== 0) result += `${h}, `;
    if (min !== 0) result += `${m}, `;
    
    result = result.substring(0, Math.max(0, result.length - 2));
    if ((yrs !== 0 || mon !== 0 || days !== 0 || min !== 0 || hrs !== 0) && sec !== 0) {
        result += ', ' + s;
    }

    if (yrs === 0 && mon === 0 && days === 0 && hrs === 0 && min === 0) {
        result += s;
    }

    return result.trim();
}

/**
 * Returns a word form of a provided
 * number. Useful for number emotes.
 * 
 * @param int the number to convert
 * @see https://gist.github.com/ForbesLindesay/5467742
 */
 export const intToWords = (int: number) => {
    let ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
                'seventeen', 'eighteen', 'nineteen'];

    let tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty',
                'ninety'];
  
    let numString = int.toString();
    if (int < 0) return null;
    if (int === 0) return 'zero';
    if (int < 20) return ones[int];
  
    if (numString.length === 2)
        return tens[numString[0]] + ' ' + ones[numString[1]];
  
    if (numString.length == 3) {
        if (numString[1] === '0' && numString[2] === '0')
            return ones[numString[0]] + ' hundred';
        else
            return ones[numString[0]] + ' hundred and ' + intToWords(+(numString[1] + numString[2]));
    }
  
    if (numString.length === 4) {
        var end = +(numString[1] + numString[2] + numString[3]);
        if (end === 0) return ones[numString[0]] + ' thousand';
        if (end < 100) return ones[numString[0]] + ' thousand and ' + intToWords(end);
        return ones[numString[0]] + ' thousand ' + intToWords(end);
    }
}

/**
 * Given a time like "9:00 PM", returns
 * a date object containing the time,
 * and optionally from a given initial
 * date.
 * 
 * @param time the time to convert
 * @param date the initial date (or now)
 */
export const getDateFromTime = (time: string, date = new Date()) => {
    let offset = time.split(':')[0].length;
    let hours = parseInt(time.substring(0, offset));
    if (hours !== 12 && time.includes('PM'))
        hours += 12;

    return new Date(date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    hours,
                    parseInt(time.substring(offset + 1, offset + 3)),
                    0, 0);
}

/**
 * Returns whether or not this service is running
 * on the provided release stage.
 * 
 * @param target the release stage to check
 */
const isEnv = (target: 'development' | 'preview' | 'production') => (process.env.NEXT_PUBLIC_VERCEL_ENV || 'development') === target;

/**
 * Returns whether or not this service is running
 * in a development environment.
 */
export const isDevelopment = () => isEnv('development');

/**
 * Returns whether or not this service is running
 * in a preview (staging) environment.
 */
export const isPreview = () => isEnv('preview');

/**
 * Returns whether or not this service is running
 * in production.
 */
export const isProd = () => isEnv('production');