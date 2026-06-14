
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateSection } from "@/features/stores"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
})

export function SectionForm({ storeId }: { storeId: string }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    })

    const createSection = useCreateSection(storeId)

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await createSection.mutateAsync(values)
            form.reset()
            toast.success("Section added")
        } catch {
            // Error toast handled by the mutation hook
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input placeholder="Add new section (e.g. Produce)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" size="icon" disabled={createSection.isPending}>
                    <Plus className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}
