const clean = (str: string) => str.replace(/\/Users\/[^/]+\//g, '~/')
export default clean
