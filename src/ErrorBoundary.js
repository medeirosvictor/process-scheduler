import React, { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })
        console.error('Process Scheduler error:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Titillium Web, sans-serif' }}>
                    <h1>Something went wrong</h1>
                    <p style={{ color: 'crimson' }}>
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
                        <summary>Error details</summary>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={this.handleReset}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            backgroundColor: '#282c34',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Titillium Web, sans-serif',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}
                    >
                        Return to Home
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
