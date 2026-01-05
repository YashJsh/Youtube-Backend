const asyncHandler = (fn)=>{
    return async (req, res, next)=>{
        try {
            await fn(req, res, next)
        } catch (error) {
            return res.status(500).json({
                success : false,
                message : error.message
            })
        }
    }
};

export { asyncHandler }

const handler = (requestHandler)=>{
    (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch(()=>{
            next(err)
        })
    }
};