// components/StreamSelectionModal.jsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, Loader2 } from "lucide-react";

const streamSchema = z.object({
  stream: z.string().min(1, { message: "Stream selection is required." }),
});

// Assuming Class.STREAM_CHOICES structure: [['science', 'Science'], ['arts', 'Arts'], ...]
const streamOptions = [
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts" },
  { value: "commerce", label: "Commerce" },
  // Add more based on your Class.STREAM_CHOICES
];

function StreamSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  workflow,
  isLoading,
}) {
  const form = useForm({
    resolver: zodResolver(streamSchema),
    defaultValues: { stream: "" },
  });

  const studentName = workflow?.student
    ? `${workflow.student.first_name} ${workflow.student.last_name}`
    : "Student";
  const previousClass =
    workflow?.promotion_decision?.previous_class?.full_name || "previous class";

  useEffect(() => {
    if (!isOpen) form.reset();
  }, [isOpen, form]);

  const handleFormSubmit = (values) => {
    onSubmit(values.stream); // Pass only the selected stream value
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Select Stream for {studentName}</DialogTitle>
          <DialogDescription>
            Student promoted from {previousClass}. Select the appropriate stream
            for the next level.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            {/* Optional: Display relevant info like subjects/grades if available in workflow.promotion_decision */}
            {/* <Alert> <AlertTitle>Academic Info</AlertTitle> <AlertDescription>...</AlertDescription> </Alert> */}

            <FormField
              control={form.control}
              name="stream"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Stream *</FormLabel>
                  <ShadSelect
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Stream" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {streamOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </ShadSelect>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Confirm Stream
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default StreamSelectionModal;
