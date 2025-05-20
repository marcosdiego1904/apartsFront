interface Buts {
    text:string,
    type: ButtonType;
}
type ButtonType = "submit" | "button" | "reset";
export const Buttons = ({text,type}:Buts) => {
    return (
        <>
            <button type={type}>{text}</button>
        </>
    )
}