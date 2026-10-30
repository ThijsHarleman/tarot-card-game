import './CardBack.css'

interface CardBackProps {
    index: number
}

export function CardBack({ index }: CardBackProps) {
    return (
        <div
            className="hand__card hand__card--hidden"
            aria-label={`Hidden opponent card ${index + 1}`}
        >
            <div className="card-back" aria-hidden="true">
                <div className="card-back__inner">
                    <span className="card-back__symbol">✦</span>
                </div>
            </div>
        </div>
    )
}
